-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 19, 2026 at 12:17 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tracking_app`
--

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `item_id` int(11) NOT NULL,
  `item_code` varchar(50) NOT NULL,
  `item_name` varchar(150) NOT NULL,
  `unit` varchar(30) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`item_id`, `item_code`, `item_name`, `unit`, `description`, `status`) VALUES
(1, 'BRG-001', 'Pipa Besi 2 Meter', 'Batang', 'Pipa besi panjang 2 meter', 'active'),
(2, 'BRG-002', 'Selang Hidrolik', 'Roll', 'Selang hidrolik untuk alat berat', 'active'),
(3, 'BRG-003', 'Mur Baut M12', 'Box', 'Mur baut ukuran M12', 'active'),
(4, 'VP-00-010-D85', 'HOSE 5/8 + FITTING (P=5200 mm)', 'Each', 'Hose Dozer', 'active'),
(5, 'XT50', 'bolt', 'each', 'Baut', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `shipments`
--

CREATE TABLE `shipments` (
  `shipment_id` int(11) NOT NULL,
  `po_number` varchar(50) NOT NULL,
  `delivery_note_number` varchar(50) DEFAULT NULL,
  `supplier_id` int(11) NOT NULL,
  `source_type` enum('supplier','transit') NOT NULL DEFAULT 'supplier',
  `source_warehouse_id` int(11) DEFAULT NULL,
  `destination_warehouse_id` int(11) NOT NULL,
  `shipment_date` date NOT NULL,
  `current_status` varchar(100) NOT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shipments`
--

INSERT INTO `shipments` (`shipment_id`, `po_number`, `delivery_note_number`, `supplier_id`, `source_type`, `source_warehouse_id`, `destination_warehouse_id`, `shipment_date`, `current_status`, `created_by`, `created_at`) VALUES
(1, 'E01128', 'UT001', 3, 'supplier', NULL, 3, '2026-04-19', 'Received at Transit', 1, '2026-04-19 13:47:34'),
(2, 'X0345', 'rtyii123', 4, 'supplier', NULL, 3, '2026-04-19', 'Received at Main Warehouse', 1, '2026-04-19 14:46:57');

-- --------------------------------------------------------

--
-- Table structure for table `shipment_details`
--

CREATE TABLE `shipment_details` (
  `detail_id` int(11) NOT NULL,
  `shipment_id` int(11) NOT NULL,
  `item_id` int(11) DEFAULT NULL,
  `manual_item_name` varchar(150) DEFAULT NULL,
  `manual_description` text DEFAULT NULL,
  `qty` int(11) NOT NULL,
  `unit` varchar(30) NOT NULL,
  `item_input_type` enum('master','manual') NOT NULL,
  `verification_status` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  `verified_item_id` int(11) DEFAULT NULL,
  `note` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shipment_details`
--

INSERT INTO `shipment_details` (`detail_id`, `shipment_id`, `item_id`, `manual_item_name`, `manual_description`, `qty`, `unit`, `item_input_type`, `verification_status`, `verified_item_id`, `note`) VALUES
(1, 1, 4, '', '', 1, 'COLLY', 'master', 'verified', NULL, 'WAREHOUSE TRANSIT SURABAYA'),
(2, 2, 5, '', '', 1, 'box', 'master', 'verified', NULL, 'orderan paK adi');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `supplier_id` int(11) NOT NULL,
  `supplier_name` varchar(150) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`supplier_id`, `supplier_name`, `address`, `phone`, `email`, `status`) VALUES
(1, 'PT Sumber Baja', 'Pati', '081234567890', 'supplier1@mail.com', 'active'),
(2, 'PT Logam Jaya', 'Semarang', '081345678901', 'supplier2@mail.com', 'active'),
(3, 'PT United Tractor - Surabaya', 'Surabaya', '', '', 'active'),
(4, 'PT. maju mundur', 'Semarang', '', '', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `tracking_history`
--

CREATE TABLE `tracking_history` (
  `tracking_id` int(11) NOT NULL,
  `shipment_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `tracking_status` varchar(100) NOT NULL,
  `update_time` datetime NOT NULL,
  `updated_by` int(11) NOT NULL,
  `note` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tracking_history`
--

INSERT INTO `tracking_history` (`tracking_id`, `shipment_id`, `warehouse_id`, `tracking_status`, `update_time`, `updated_by`, `note`) VALUES
(1, 1, 3, 'Received at Transit', '2026-04-19 13:47:34', 1, 'Shipment dibuat'),
(2, 2, 3, 'Received at Transit', '2026-04-19 14:46:57', 1, 'Shipment dibuat'),
(3, 2, 2, 'On Delivery to Main Warehouse', '2026-04-19 14:47:44', 1, 'segera kirim ke warehouse utama'),
(4, 2, 3, 'Received at Main Warehouse', '2026-04-19 14:48:13', 1, 'segera kirim ke warehouse utama');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','transit','main_warehouse') NOT NULL,
  `warehouse_id` int(11) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `full_name`, `username`, `password`, `role`, `warehouse_id`, `status`) VALUES
(1, 'Admin Sistem', 'admin', '$2y$12$WgU1Lau7YNSPKtdquX41susDwNQwjHQtZkge7N0W9A0OM2u/1hYt6', 'admin', NULL, 'active'),
(2, 'Security Transit 1', 'transit1', '$2y$12$WgU1Lau7YNSPKtdquX41susDwNQwjHQtZkge7N0W9A0OM2u/1hYt6', 'transit', 1, 'active'),
(3, 'Petugas Warehouse Utama', 'mainwh', '$2y$12$WgU1Lau7YNSPKtdquX41susDwNQwjHQtZkge7N0W9A0OM2u/1hYt6', 'main_warehouse', 3, 'active');

-- --------------------------------------------------------

--
-- Table structure for table `warehouses`
--

CREATE TABLE `warehouses` (
  `warehouse_id` int(11) NOT NULL,
  `warehouse_name` varchar(150) NOT NULL,
  `warehouse_type` enum('transit','main') NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `warehouses`
--

INSERT INTO `warehouses` (`warehouse_id`, `warehouse_name`, `warehouse_type`, `address`, `status`) VALUES
(1, 'Warehouse Transit 1', 'transit', 'Area Transit 1', 'active'),
(2, 'Warehouse Transit 2', 'transit', 'Area Transit 2', 'active'),
(3, 'Warehouse Utama', 'main', 'Area Main Warehouse', 'active');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`item_id`),
  ADD UNIQUE KEY `item_code` (`item_code`);

--
-- Indexes for table `shipments`
--
ALTER TABLE `shipments`
  ADD PRIMARY KEY (`shipment_id`),
  ADD KEY `fk_shipments_supplier` (`supplier_id`),
  ADD KEY `fk_shipments_source_warehouse` (`source_warehouse_id`),
  ADD KEY `fk_shipments_destination_warehouse` (`destination_warehouse_id`),
  ADD KEY `fk_shipments_created_by` (`created_by`);

--
-- Indexes for table `shipment_details`
--
ALTER TABLE `shipment_details`
  ADD PRIMARY KEY (`detail_id`),
  ADD KEY `fk_details_shipment` (`shipment_id`),
  ADD KEY `fk_details_item` (`item_id`),
  ADD KEY `fk_details_verified_item` (`verified_item_id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`supplier_id`);

--
-- Indexes for table `tracking_history`
--
ALTER TABLE `tracking_history`
  ADD PRIMARY KEY (`tracking_id`),
  ADD KEY `fk_tracking_shipment` (`shipment_id`),
  ADD KEY `fk_tracking_warehouse` (`warehouse_id`),
  ADD KEY `fk_tracking_user` (`updated_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `fk_users_warehouse` (`warehouse_id`);

--
-- Indexes for table `warehouses`
--
ALTER TABLE `warehouses`
  ADD PRIMARY KEY (`warehouse_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `shipments`
--
ALTER TABLE `shipments`
  MODIFY `shipment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `shipment_details`
--
ALTER TABLE `shipment_details`
  MODIFY `detail_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `supplier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tracking_history`
--
ALTER TABLE `tracking_history`
  MODIFY `tracking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `warehouses`
--
ALTER TABLE `warehouses`
  MODIFY `warehouse_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `shipments`
--
ALTER TABLE `shipments`
  ADD CONSTRAINT `fk_shipments_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_shipments_destination_warehouse` FOREIGN KEY (`destination_warehouse_id`) REFERENCES `warehouses` (`warehouse_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_shipments_source_warehouse` FOREIGN KEY (`source_warehouse_id`) REFERENCES `warehouses` (`warehouse_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_shipments_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON UPDATE CASCADE;

--
-- Constraints for table `shipment_details`
--
ALTER TABLE `shipment_details`
  ADD CONSTRAINT `fk_details_item` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_details_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`shipment_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_details_verified_item` FOREIGN KEY (`verified_item_id`) REFERENCES `items` (`item_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `tracking_history`
--
ALTER TABLE `tracking_history`
  ADD CONSTRAINT `fk_tracking_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`shipment_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tracking_user` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tracking_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`warehouse_id`) ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`warehouse_id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
