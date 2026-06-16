# monitoring-tracking

# Shipment Monitoring & Tracking System

## Overview

Shipment Monitoring & Tracking System is a web-based application developed to monitor the movement of goods from suppliers, through transit warehouses, to the main warehouse.

This project was developed as part of an Information Systems final project and was inspired by operational challenges in remote mining support areas, where shipment visibility is not fully covered by the existing ERP system. The application provides a simple and centralized tracking mechanism to improve shipment monitoring and status updates across warehouse locations.

---

## Features

* User Authentication
* Shipment Registration
* Shipment Detail Management
* Manual Item Verification
* Shipment Status Update
* Tracking History Recording
* Monitoring Dashboard
* PDF Report Export
* Supplier Management
* Master Item Management

---

## User Roles

### Administrator

* Manage suppliers
* Manage master items
* Monitor shipment status
* View tracking history

### Transit Warehouse Crew

* Input shipment data
* Update status: Received at Transit
* Update status: On Delivery to Main Warehouse

### Main Warehouse Crew

* Verify incoming items
* Update status: Received at Main Warehouse
* View shipment history

---

## Technology Stack

### Frontend

* HTML
* CSS
* JavaScript
* Vue.js

### Backend

* PHP

### Database

* MySQL

### Reporting

* jsPDF

---

## Database Design

The system uses six main entities:

* Users
* Suppliers
* Warehouses
* Items
* Shipments
* Shipment Details
* Tracking History

---

## Main Workflow

1. Supplier sends goods.
2. Transit warehouse receives shipment.
3. Transit crew records shipment data.
4. Shipment status updated to "Received at Transit".
5. Goods are delivered to Main Warehouse.
6. Status updated to "On Delivery to Main Warehouse".
7. Main Warehouse receives goods.
8. Manual verification is performed.
9. Status updated to "Received at Main Warehouse".
10. Tracking history is stored automatically.

---

## Screenshots

### Dashboard

<img width="1403" height="680" alt="image" src="https://github.com/user-attachments/assets/2c316238-ac7d-4b3c-9374-4f3588f2c7ae" />



---

## Project Purpose

This application was developed to improve shipment visibility, tracking accuracy, and operational monitoring in warehouse distribution activities, particularly in environments where ERP coverage is limited and additional tracking control is required.

---

## Author

Ahmad Nugroho Sah Utomo

Data Analytics Enthusiast | Supply Chain Management

Final Project – Universitas Terbuka


