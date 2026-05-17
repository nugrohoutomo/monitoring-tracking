const { createApp } = Vue;

createApp({
    data() {
        return {
            apiBase: 'https://salad-strongman-sullen.ngrok-free.dev/trackingapp_tes/backend/index.php',
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
        }
    }
}).mount('#app');