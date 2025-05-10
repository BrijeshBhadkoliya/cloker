-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: cloker_dummy
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `employee`
--

DROP TABLE IF EXISTS `employee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee` (
  `id` int NOT NULL AUTO_INCREMENT,
  `firstName` longtext,
  `lastName` longtext,
  `userName` longtext,
  `email` longtext,
  `phoneNum` longtext,
  `password` longtext,
  `birthDate` longtext,
  `profileimage` longtext,
  `idimage` json DEFAULT NULL,
  `status` longtext,
  `joinDate` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee`
--

LOCK TABLES `employee` WRITE;
/*!40000 ALTER TABLE `employee` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_admin`
--

DROP TABLE IF EXISTS `tbl_admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_admin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` longtext,
  `email` longtext,
  `country` longtext,
  `phone` longtext,
  `password` longtext,
  `role` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_admin`
--

LOCK TABLES `tbl_admin` WRITE;
/*!40000 ALTER TABLE `tbl_admin` DISABLE KEYS */;
INSERT INTO `tbl_admin` VALUES (4,'CSCODE','admin@email.com','India','98607346789','$2b$10$4Vir.Mk4xQ3UZenZDyXqfuOr7dTQqdp9i1enY6lCPWRZ6mh.wKAXq','admin');
/*!40000 ALTER TABLE `tbl_admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_employee_attndence`
--

DROP TABLE IF EXISTS `tbl_employee_attndence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_employee_attndence` (
  `id` int NOT NULL AUTO_INCREMENT,
  `emplyeeId` longtext,
  `date` longtext,
  `all_time` json DEFAULT NULL,
  `clockIn_time` longtext,
  `clockOut_time` longtext,
  `break_time` longtext,
  `productive_time` longtext,
  `extra_time` longtext,
  `total_time` longtext,
  `clockIn_ip` longtext,
  `clockOut_ip` longtext,
  `day_status` longtext,
  `attendens_status` longtext,
  `leave_resone` longtext,
  `leave_type` longtext,
  `leave_attachment` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=183 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_employee_attndence`
--

LOCK TABLES `tbl_employee_attndence` WRITE;
/*!40000 ALTER TABLE `tbl_employee_attndence` DISABLE KEYS */;
/*!40000 ALTER TABLE `tbl_employee_attndence` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tbl_setting`
--

DROP TABLE IF EXISTS `tbl_setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_setting` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dark_img` longtext,
  `light_img` longtext,
  `employee_worktime` longtext,
  `site_titel` longtext,
  `shift_start` longtext,
  `shift_end` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tbl_setting`
--

LOCK TABLES `tbl_setting` WRITE;
/*!40000 ALTER TABLE `tbl_setting` DISABLE KEYS */;
INSERT INTO `tbl_setting` VALUES (8,'1746879164516logoround.png','1746861731832Group 8.png','00:30:00','Attendance','09:00','18:30');
/*!40000 ALTER TABLE `tbl_setting` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-10 18:23:09
