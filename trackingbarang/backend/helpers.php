<?php
function jsonResponse($data, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function getJsonInput(): array
{
    $input = file_get_contents('php://input');
    if (!$input) {
        return [];
    }

    $decoded = json_decode($input, true);
    return is_array($decoded) ? $decoded : [];
}

function requireFields(array $data, array $fields): void
{
    foreach ($fields as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            jsonResponse(['success' => false, 'message' => "Field {$field} wajib diisi."], 422);
        }
    }
}

function sanitizeLike(string $value): string
{
    return '%' . trim($value) . '%';
}
