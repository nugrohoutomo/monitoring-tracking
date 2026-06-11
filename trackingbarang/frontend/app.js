const { createApp } = Vue;

createApp({
    data() {
        return {
            apiBase: 'https://trackingshipment.org/backend/index.php', //'https://salad-strongman-sullen.ngrok-free.dev/trackingapp_tes/backend/index.php',
            user: null,
            activeTab: 'shipments',
            message: { text: '', type: 'success' },
            dashboard: {},
            suppliers: [],
            warehouses: [],
            items: [],
            shipments: [],
            shipmentSearch: '',
shipmentStatusFilter: '',
            manualItems: [],
            selectedShipment: null,
            verificationMap: {},
            loginForm: {
                username: '',
                password: ''
            },
            supplierForm: {
                supplier_name: '',
                address: ''
            },
            itemForm: {
                item_code: '',
                item_name: '',
                unit: '',
                description: ''
            },
            shipmentForm: {
                po_number: '',
                delivery_note_number: '',
                supplier_id: '',
                destination_warehouse_id: '',
                shipment_date: new Date().toISOString().slice(0, 10),
                current_status: 'Received at Transit',
                details: [
                    {
                        item_input_type: 'master',
                        item_id: '',
                        manual_item_name: '',
                        manual_description: '',
                        qty: 1,
                        unit: '',
                        note: ''
                    }
                ]
            },
            statusForm: {
                shipment_id: '',
                warehouse_id: '',
                tracking_status: 'On Delivery to Main Warehouse',
                note: ''
            }
        };
    },
computed: {
    filteredShipments() {
        let data = this.shipments;

        if (this.shipmentSearch) {
            const key = this.shipmentSearch.toLowerCase();

            data = data.filter(r =>
                (r.po_number || '').toLowerCase().includes(key) ||
                (r.supplier_name || '').toLowerCase().includes(key) ||
                (r.destination_warehouse || '').toLowerCase().includes(key) ||
                (r.current_status || '').toLowerCase().includes(key)
            );
        }

        if (this.shipmentStatusFilter) {
            data = data.filter(r => r.current_status === this.shipmentStatusFilter);
        }

        return data;
    }
},
    mounted() {
        this.checkSession();
    },

    methods: {
        async apiRequest(action, options = {}) {
            const url = `${this.apiBase}?action=${action}${options.query ? '&' + options.query : ''}`;

            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: options.body ? JSON.stringify(options.body) : undefined
            });

            const data = await response.json();

            if (!response.ok || data.success === false) {
                throw new Error(data.message || 'Terjadi kesalahan.');
            }

            return data;
        },

        async checkSession() {
            try {
                const res = await this.apiRequest('me');

                if (res.data) {
                    this.user = res.data;
                    await this.loadAll();
                } else {
                    this.user = null;
                }
            } catch (error) {
                this.user = null;
            }
        },

        setMessage(text, type = 'success') {
            this.message = { text, type };
            setTimeout(() => {
                this.message = { text: '', type: 'success' };
            }, 3000);
        },

        async login() {
            try {
                const res = await this.apiRequest('login', {
                    method: 'POST',
                    body: this.loginForm
                });

                this.user = res.data;
                this.setMessage(res.message);
                await this.loadAll();
            } catch (error) {
                this.setMessage(error.message, 'error');
            }
        },

        async logout() {
            try {
                await this.apiRequest('logout', { method: 'POST' });
            } catch (error) {
                // abaikan error logout
            }

            this.user = null;
            this.selectedShipment = null;
            this.setMessage('Logout berhasil.');
        },

        async loadAll() {
            await Promise.all([
                this.loadDashboard(),
                this.loadSuppliers(),
                this.loadWarehouses(),
                this.loadItems(),
                this.loadShipments(),
                this.loadManualItems()
            ]);
        },

        async loadDashboard() {
            const res = await this.apiRequest('dashboard');
            this.dashboard = res.data;
        },

        async loadSuppliers() {
            const res = await this.apiRequest('suppliers');
            this.suppliers = res.data;
        },

        async loadWarehouses() {
            const res = await this.apiRequest('warehouses');
            this.warehouses = res.data;
        },

        async loadItems() {
            const res = await this.apiRequest('items');
            this.items = res.data;
        },

        async loadShipments() {
            const res = await this.apiRequest('shipments');
            this.shipments = res.data;
        },

        async loadManualItems() {
            if (!this.user || this.user.role !== 'admin') {
                this.manualItems = [];
                return;
            }

            const res = await this.apiRequest('manual-items');
            this.manualItems = res.data;
        },

        addDetail() {
            this.shipmentForm.details.push({
                item_input_type: 'master',
                item_id: '',
                manual_item_name: '',
                manual_description: '',
                qty: 1,
                unit: '',
                note: ''
            });
        },

        removeDetail(index) {
            this.shipmentForm.details.splice(index, 1);
        },

        resetShipmentForm() {
            this.shipmentForm = {
                po_number: '',
                delivery_note_number: '',
                supplier_id: '',
                destination_warehouse_id: '',
                shipment_date: new Date().toISOString().slice(0, 10),
                current_status: 'Received at Transit',
                details: [
                    {
                        item_input_type: 'master',
                        item_id: '',
                        manual_item_name: '',
                        manual_description: '',
                        qty: 1,
                        unit: '',
                        note: ''
                    }
                ]
            };
        },

        async saveShipment() {
            try {
                await this.apiRequest('shipments', {
                    method: 'POST',
                    body: this.shipmentForm
                });

                this.setMessage('Shipment berhasil disimpan.');
                this.resetShipmentForm();
                await this.loadAll();
                this.activeTab = 'shipments';
            } catch (error) {
                this.setMessage(error.message, 'error');
            }
        },

async viewShipment(id) {
    try {
        const res = await this.apiRequest('shipment-detail', {
            query: `shipment_id=${id}`
        });

        this.selectedShipment = res.data;

        console.log("DATA SHIPMENT:");
        console.log(this.selectedShipment);

        this.activeTab = 'monitoring';
        this.statusForm.shipment_id = id;
    } catch (error) {
        this.setMessage(error.message, 'error');
    }
},

        async updateStatus() {
            try {
                await this.apiRequest('update-status', {
                    method: 'POST',
                    body: this.statusForm
                });

                this.setMessage('Status berhasil diperbarui.');
                await this.loadAll();

                if (this.statusForm.shipment_id) {
                    await this.viewShipment(this.statusForm.shipment_id);
                }
            } catch (error) {
                this.setMessage(error.message, 'error');
            }
        },

        async verifyManual(detailId) {
            const verifiedItemId = this.verificationMap[detailId];

            if (!verifiedItemId) {
                this.setMessage('Pilih item master terlebih dahulu.', 'error');
                return;
            }

            try {
                await this.apiRequest('verify-manual-item', {
                    method: 'POST',
                    body: {
                        detail_id: detailId,
                        verified_item_id: verifiedItemId
                    }
                });

                this.setMessage('Barang manual berhasil diverifikasi.');
                await this.loadAll();
            } catch (error) {
                this.setMessage(error.message, 'error');
            }
        },

        async saveSupplier() {
            try {
                await this.apiRequest('suppliers', {
                    method: 'POST',
                    body: this.supplierForm
                });

                this.setMessage('Supplier berhasil ditambahkan.');
                this.supplierForm = { supplier_name: '', address: '' };
                await this.loadSuppliers();
            } catch (error) {
                this.setMessage(error.message, 'error');
            }
        },

        async saveItem() {
            try {
                await this.apiRequest('items', {
                    method: 'POST',
                    body: this.itemForm
                });

                this.setMessage('Master barang berhasil ditambahkan.');
                this.itemForm = {
                    item_code: '',
                    item_name: '',
                    unit: '',
                    description: ''
                };
                await this.loadItems();
            } catch (error) {
                this.setMessage(error.message, 'error');
            }
        },
      exportPDF() {

    if (!this.selectedShipment) {
        alert("Pilih shipment terlebih dahulu");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const shipment = this.selectedShipment.shipment;
    const details = this.selectedShipment.details;
    const tracking = this.selectedShipment.tracking;

let y = 20;

// Judul
doc.setFontSize(18);
doc.setFont(undefined, "bold");
doc.text("MONITORING TRACKING BARANG", 20, y);

// Garis bawah judul
y += 5;
doc.line(20, y, 190, y);

y += 12;

// Kembalikan font normal
doc.setFont(undefined, "normal");

doc.rect(15, y - 5, 180, 35);

doc.setFontSize(11);

doc.text(`PO Number : ${shipment.po_number || '-'}`, 20, y);
y += 8;

doc.text(`Supplier : ${shipment.supplier_name || '-'}`, 20, y);
y += 8;

doc.text(`Status : ${shipment.current_status || shipment.status || '-'}`, 20, y);
y += 8;

doc.text(`Tanggal : ${shipment.shipment_date || '-'}`, 20, y);

    y += 15;

doc.setFontSize(14);
doc.setFont(undefined, "bold");
doc.text("DETAIL BARANG", 20, y);
doc.setFont(undefined, "normal");

    y += 10;

doc.setFontSize(11);

// Header tabel
doc.line(20, y, 190, y);
y += 7;

doc.text("No", 25, y);
doc.text("Nama Barang", 40, y);
doc.text("Qty", 140, y);
doc.text("Unit", 165, y);

y += 4;
doc.line(20, y, 190, y);

let no = 1;

details.forEach(item => {

    y += 8;

    doc.text(String(no), 25, y);

    doc.text(
        item.item_name || '-',
        40,
        y
    );

    doc.text(
        String(item.qty || 0),
        140,
        y
    );

    doc.text(
        item.unit || '-',
        165,
        y
    );

    no++;
});

y += 5;
doc.line(20, y, 190, y);

    y += 10;

    doc.setFontSize(13);
    doc.text("RIWAYAT TRACKING", 20, y);

    y += 10;

    doc.setFontSize(11);

let nomorTracking = 1;

tracking.forEach(row => {

    doc.setFont(undefined, "bold");
    doc.text(
        `${nomorTracking}. ${row.tracking_status}`,
        25,
        y
    );

    doc.setFont(undefined, "normal");

    y += 8;

    doc.text(
        `Warehouse : ${row.warehouse_name || '-'}`,
        35,
        y
    );

    y += 6;

    doc.text(
        `Waktu : ${row.update_time || '-'}`,
        35,
        y
    );

    y += 6;

    doc.text(
        `Petugas : ${row.updated_by_name || '-'}`,
        35,
        y
    );

    y += 6;

    if (row.note) {

        doc.text(
            `Catatan : ${row.note}`,
            35,
            y
        );

        y += 6;
    }

    y += 4;

    doc.line(30, y, 180, y);

    y += 8;

    nomorTracking++;
});
y += 10;

doc.line(20, y, 190, y);

y += 8;

doc.setFontSize(9);

doc.text(
    `Dicetak pada : ${new Date().toLocaleString('id-ID')}`,
    20,
    y
);

    doc.save(`Shipment_${shipment.po_number}.pdf`);
}
}
}).mount('#app');
