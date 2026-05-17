<?php
session_start();

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'http://localhost',
    'http://localhost:80',
    'https://salad-strongman-sullen.ngrok-free.dev'
];

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require __DIR__ . '/db.php';
require __DIR__ . '/helpers.php';

$action = $_GET['action'] ?? 'ping';
$method = $_SERVER['REQUEST_METHOD'];
$pdo = getConnection();

function currentUser(): ?array
{
    return $_SESSION['user'] ?? null;
}

function authRequired(): array
{
    $user = currentUser();
    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Silakan login terlebih dahulu.'], 401);
    }
    return $user;
}

function createTracking(PDO $pdo, int $shipmentId, int $warehouseId, string $status, int $userId, string $note = ''): void
{
    $stmt = $pdo->prepare('INSERT INTO tracking_history (shipment_id, warehouse_id, tracking_status, update_time, updated_by, note)
                           VALUES (?, ?, ?, NOW(), ?, ?)');
    $stmt->execute([$shipmentId, $warehouseId, $status, $userId, $note]);
}

switch ($action) {
    case 'ping':
        jsonResponse(['success' => true, 'message' => 'API aktif']);
        break;

    case 'login':
        $data = getJsonInput();
        requireFields($data, ['username', 'password']);

        $stmt = $pdo->prepare('SELECT user_id, full_name, username, password, role, warehouse_id, status
                               FROM users WHERE username = ? LIMIT 1');
        $stmt->execute([$data['username']]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($data['password'], $user['password'])) {
            jsonResponse(['success' => false, 'message' => 'Username atau password salah.'], 401);
        }

        if ($user['status'] !== 'active') {
            jsonResponse(['success' => false, 'message' => 'User tidak aktif.'], 403);
        }

        unset($user['password']);
        $_SESSION['user'] = $user;
        jsonResponse(['success' => true, 'message' => 'Login berhasil.', 'data' => $user]);
        break;

    case 'logout':
        session_destroy();
        jsonResponse(['success' => true, 'message' => 'Logout berhasil.']);
        break;

    case 'me':
        jsonResponse(['success' => true, 'data' => currentUser()]);
        break;

    case 'suppliers':
        authRequired();
        if ($method === 'GET') {
            $rows = $pdo->query('SELECT * FROM suppliers ORDER BY supplier_name')->fetchAll();
            jsonResponse(['success' => true, 'data' => $rows]);
        }
        if ($method === 'POST') {
            $data = getJsonInput();
            requireFields($data, ['supplier_name']);
            $stmt = $pdo->prepare('INSERT INTO suppliers (supplier_name, address, phone, email, status)
                                   VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([
                $data['supplier_name'],
                $data['address'] ?? '',
                $data['phone'] ?? '',
                $data['email'] ?? '',
                $data['status'] ?? 'active'
            ]);
            jsonResponse(['success' => true, 'message' => 'Supplier berhasil ditambahkan.']);
        }
        break;

    case 'warehouses':
        authRequired();
        if ($method === 'GET') {
            $rows = $pdo->query('SELECT * FROM warehouses ORDER BY warehouse_name')->fetchAll();
            jsonResponse(['success' => true, 'data' => $rows]);
        }
        break;

    case 'items':
        authRequired();
        if ($method === 'GET') {
            $keyword = trim($_GET['keyword'] ?? '');
            if ($keyword !== '') {
                $stmt = $pdo->prepare('SELECT * FROM items WHERE item_name LIKE ? OR item_code LIKE ? ORDER BY item_name');
                $search = sanitizeLike($keyword);
                $stmt->execute([$search, $search]);
                $rows = $stmt->fetchAll();
            } else {
                $rows = $pdo->query('SELECT * FROM items ORDER BY item_name')->fetchAll();
            }
            jsonResponse(['success' => true, 'data' => $rows]);
        }
        if ($method === 'POST') {
            $data = getJsonInput();
            requireFields($data, ['item_code', 'item_name', 'unit']);
            $stmt = $pdo->prepare('INSERT INTO items (item_code, item_name, unit, description, status)
                                   VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([
                $data['item_code'],
                $data['item_name'],
                $data['unit'],
                $data['description'] ?? '',
                $data['status'] ?? 'active'
            ]);
            jsonResponse(['success' => true, 'message' => 'Master barang berhasil ditambahkan.']);
        }
        break;

    case 'shipments':
        $user = authRequired();
        if ($method === 'GET') {
            $sql = 'SELECT s.shipment_id, s.po_number, s.delivery_note_number, s.shipment_date, s.current_status,
                           sp.supplier_name,
                           sw.warehouse_name AS source_warehouse,
                           dw.warehouse_name AS destination_warehouse,
                           u.full_name AS created_by_name
                    FROM shipments s
                    LEFT JOIN suppliers sp ON sp.supplier_id = s.supplier_id
                    LEFT JOIN warehouses sw ON sw.warehouse_id = s.source_warehouse_id
                    LEFT JOIN warehouses dw ON dw.warehouse_id = s.destination_warehouse_id
                    LEFT JOIN users u ON u.user_id = s.created_by
                    ORDER BY s.shipment_id DESC';
            $rows = $pdo->query($sql)->fetchAll();
            jsonResponse(['success' => true, 'data' => $rows]);
        }

        if ($method === 'POST') {
            $data = getJsonInput();
            requireFields($data, ['po_number', 'supplier_id', 'destination_warehouse_id', 'shipment_date']);

            $details = $data['details'] ?? [];
            if (!is_array($details) || count($details) === 0) {
                jsonResponse(['success' => false, 'message' => 'Minimal harus ada 1 detail barang.'], 422);
            }

            $pdo->beginTransaction();
            try {
                $stmt = $pdo->prepare('INSERT INTO shipments (
                        po_number, delivery_note_number, supplier_id, source_type, source_warehouse_id,
                        destination_warehouse_id, shipment_date, current_status, created_by, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())');

                $stmt->execute([
                    $data['po_number'],
                    $data['delivery_note_number'] ?? '',
                    (int) $data['supplier_id'],
                    $data['source_type'] ?? 'supplier',
                    !empty($data['source_warehouse_id']) ? (int) $data['source_warehouse_id'] : null,
                    (int) $data['destination_warehouse_id'],
                    $data['shipment_date'],
                    $data['current_status'] ?? 'Received at Transit',
                    (int) $user['user_id']
                ]);

                $shipmentId = (int) $pdo->lastInsertId();

                $detailStmt = $pdo->prepare('INSERT INTO shipment_details (
                        shipment_id, item_id, manual_item_name, manual_description, qty, unit,
                        item_input_type, verification_status, verified_item_id, note
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

                foreach ($details as $detail) {
                    requireFields($detail, ['qty', 'unit', 'item_input_type']);
                    $inputType = $detail['item_input_type'];
                    if ($inputType === 'master' && empty($detail['item_id'])) {
                        jsonResponse(['success' => false, 'message' => 'Barang master harus memilih item.'], 422);
                    }
                    if ($inputType === 'manual' && empty($detail['manual_item_name'])) {
                        jsonResponse(['success' => false, 'message' => 'Barang manual harus mengisi nama barang.'], 422);
                    }

                    $detailStmt->execute([
                        $shipmentId,
                        !empty($detail['item_id']) ? (int) $detail['item_id'] : null,
                        $detail['manual_item_name'] ?? null,
                        $detail['manual_description'] ?? null,
                        (int) $detail['qty'],
                        $detail['unit'],
                        $inputType,
                        $inputType === 'manual' ? 'pending' : 'verified',
                        null,
                        $detail['note'] ?? ''
                    ]);
                }

                createTracking(
                    $pdo,
                    $shipmentId,
                    (int) $data['destination_warehouse_id'],
                    $data['current_status'] ?? 'Received at Transit',
                    (int) $user['user_id'],
                    $data['tracking_note'] ?? 'Shipment dibuat'
                );

                $pdo->commit();
                jsonResponse(['success' => true, 'message' => 'Shipment berhasil disimpan.']);
            } catch (Throwable $e) {
                $pdo->rollBack();
                jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
            }
        }
        break;

    case 'shipment-detail':
        authRequired();
        $shipmentId = (int) ($_GET['shipment_id'] ?? 0);
        if ($shipmentId <= 0) {
            jsonResponse(['success' => false, 'message' => 'shipment_id tidak valid.'], 422);
        }

        $shipmentStmt = $pdo->prepare('SELECT s.*, sp.supplier_name,
                                              sw.warehouse_name AS source_warehouse,
                                              dw.warehouse_name AS destination_warehouse
                                       FROM shipments s
                                       LEFT JOIN suppliers sp ON sp.supplier_id = s.supplier_id
                                       LEFT JOIN warehouses sw ON sw.warehouse_id = s.source_warehouse_id
                                       LEFT JOIN warehouses dw ON dw.warehouse_id = s.destination_warehouse_id
                                       WHERE s.shipment_id = ?');
        $shipmentStmt->execute([$shipmentId]);
        $shipment = $shipmentStmt->fetch();

        $detailStmt = $pdo->prepare('SELECT sd.*, i.item_name, i.item_code
                                     FROM shipment_details sd
                                     LEFT JOIN items i ON i.item_id = sd.item_id
                                     WHERE sd.shipment_id = ?');
        $detailStmt->execute([$shipmentId]);
        $details = $detailStmt->fetchAll();

        $trackStmt = $pdo->prepare('SELECT th.*, w.warehouse_name, u.full_name AS updated_by_name
                                    FROM tracking_history th
                                    LEFT JOIN warehouses w ON w.warehouse_id = th.warehouse_id
                                    LEFT JOIN users u ON u.user_id = th.updated_by
                                    WHERE th.shipment_id = ?
                                    ORDER BY th.tracking_id DESC');
        $trackStmt->execute([$shipmentId]);
        $tracking = $trackStmt->fetchAll();

        jsonResponse([
            'success' => true,
            'data' => [
                'shipment' => $shipment,
                'details' => $details,
                'tracking' => $tracking,
            ]
        ]);
        break;

    case 'update-status':
        $user = authRequired();
        if ($method !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method tidak didukung.'], 405);
        }

        $data = getJsonInput();
        requireFields($data, ['shipment_id', 'warehouse_id', 'tracking_status']);

        $pdo->beginTransaction();
        try {
            createTracking(
                $pdo,
                (int) $data['shipment_id'],
                (int) $data['warehouse_id'],
                $data['tracking_status'],
                (int) $user['user_id'],
                $data['note'] ?? ''
            );

            $stmt = $pdo->prepare('UPDATE shipments SET current_status = ? WHERE shipment_id = ?');
            $stmt->execute([$data['tracking_status'], (int) $data['shipment_id']]);

            $pdo->commit();
            jsonResponse(['success' => true, 'message' => 'Status shipment berhasil diperbarui.']);
        } catch (Throwable $e) {
            $pdo->rollBack();
            jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
        }
        break;

    case 'manual-items':
        authRequired();
        $sql = 'SELECT sd.detail_id, sd.shipment_id, sd.manual_item_name, sd.manual_description, sd.qty, sd.unit,
                       sd.verification_status, s.po_number, sp.supplier_name
                FROM shipment_details sd
                INNER JOIN shipments s ON s.shipment_id = sd.shipment_id
                LEFT JOIN suppliers sp ON sp.supplier_id = s.supplier_id
                WHERE sd.item_input_type = "manual"
                ORDER BY sd.detail_id DESC';
        $rows = $pdo->query($sql)->fetchAll();
        jsonResponse(['success' => true, 'data' => $rows]);
        break;

    case 'verify-manual-item':
        authRequired();
        if ($method !== 'POST') {
            jsonResponse(['success' => false, 'message' => 'Method tidak didukung.'], 405);
        }
        $data = getJsonInput();
        requireFields($data, ['detail_id', 'verified_item_id']);

        $stmt = $pdo->prepare('UPDATE shipment_details
                               SET verification_status = "verified",
                                   verified_item_id = ?,
                                   item_id = COALESCE(item_id, ?)
                               WHERE detail_id = ?');
        $stmt->execute([
            (int) $data['verified_item_id'],
            (int) $data['verified_item_id'],
            (int) $data['detail_id']
        ]);
        jsonResponse(['success' => true, 'message' => 'Barang manual berhasil diverifikasi.']);
        break;

    case 'dashboard':
        authRequired();
        $summary = [
            'total_shipments' => (int) $pdo->query('SELECT COUNT(*) FROM shipments')->fetchColumn(),
            'manual_pending' => (int) $pdo->query('SELECT COUNT(*) FROM shipment_details WHERE item_input_type = "manual" AND verification_status = "pending"')->fetchColumn(),
            'received_transit' => (int) $pdo->query('SELECT COUNT(*) FROM shipments WHERE current_status = "Received at Transit"')->fetchColumn(),
            'on_delivery_main' => (int) $pdo->query('SELECT COUNT(*) FROM shipments WHERE current_status = "On Delivery to Main Warehouse"')->fetchColumn(),
            'received_main' => (int) $pdo->query('SELECT COUNT(*) FROM shipments WHERE current_status = "Received at Main Warehouse"')->fetchColumn(),
        ];
        jsonResponse(['success' => true, 'data' => $summary]);
        break;

    default:
        jsonResponse(['success' => false, 'message' => 'Endpoint tidak ditemukan.'], 404);
}
