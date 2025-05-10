-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: cloker
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
INSERT INTO `employee` VALUES (32,'Avinash','gudaliya','Avinash','Avinash@gmail.com','1111111111','$2b$10$4C3RI/PB7iVy8GhVYQaIxemuUUSIradldb1DrmXc5GR4wFjRMJ/JW','2010-02-01','1746687561579pexels-brynna-spencer-63356-227294.jpg','[\"1746687559659images (1).png\"]','active','2025-05-09'),(33,'Chhayal','Pipaliya','Chhayal','Chhayal@gmail.com','2222222222','$2b$10$e6see9pRRXZXCkrolDWXvOK4yC0OTBP3P9Mwp7y4w1vf23WnFmCry','2012-06-05','1746687639537pexels-luiz-gustavo-miertschink-925274-1877749.jpg','[\"1746687636766pexels-jenyzest-1903611.jpg\"]','active',NULL),(34,'Urva','Panchani','Urva','Urva@gmail.com','3333333333','$2b$10$zkJQ6THL5QESaPCVhDX64OtlFvwrx.5nCQgiYQW2Js81ehZErfhQy','2019-04-03','1746687753996pexels-vantha-thang-1224068-2361314.jpg','[\"1746687751827pexels-enginakyurt-1642228.jpg\"]','active',NULL),(35,'Jeel','Hapani','Jeel','Jeel@gmail.com','4444444444','$2b$10$KPbAkCxUfSqCHHs.A9HQN.hbDLeot.J15xz4QTCHpcgeES90PqRQ2','2001-10-15','1746687834137pexels-eliasdecarvalho-1375849.jpg','[\"1746687835660download (1).jpg\"]','active',NULL),(36,'Harsh','Savaliya','Harsh','Harsh@gmail.com','5555555555','$2b$10$qlKOoTzL8dMz.UceiA49teIgUZFIWRzCYH3PX8NXpy7xnJCad2.YK','1970-06-05','1746687895497pexels-enginakyurt-1642228.jpg','[\"17466878952916586063-sd_240_426_30fps - Trim - Trim.mp4\"]','active',NULL),(37,'Parth','Rangholiya','Parth','Parth@gmail.com','6666666666','$2b$10$IC7ItO3rE8qVVw9EObwk9egK7efCjMkNdwNUS0am64x6v/jqIeQU6','1980-07-06','1746687955358pexels-ferdinandstudio-1104035.jpg','[\"17466879568433703715-sd_226_426_25fps - Trim - Trim.mp4\"]','active',NULL),(38,'Jay','Gajera','Jay','jay@gmail.com','7777777777','$2b$10$mOs7I/mW3YRgRoHe2jJH1e4/52YeDTA1UsV/Q3QR0jpymRn4e0Hpu','1945-06-05','1746688009001pexels-vinicius-wiesehofer-289347-1130626.jpg','[\"17466880026055244400-sd_240_426_25fps - Trim.mp4\"]','active',NULL),(39,'Chadresh','Bhil','Chadresh','Chadresh@gmail.com','8888888888','$2b$10$/H8fekFrOoXForLtJgrfi.8BzKlZUdBb50Ey3igvJKRRFHfjKhM.q','1980-05-01','1746688092981pexels-jorge-fakhouri-filho-861811-2531156.jpg','[\"174668809700417319935937188-removebg-preview.png\"]','active',NULL),(40,'Gaurav','Patel','Gaurav','Gaurav@gmail.com','9999999999','$2b$10$hk4zjYbSixB4d8Tl6Cfh5eixuF2zv16KUFHEmcvYsrKt6E0Yxs.Zm','1965-05-04','1746688198330pexels-jenyzest-1903611.jpg','[\"1746688193959pngtree-dating-app-concept-social-media-picture-image_8727406.png\"]','active',NULL),(41,'employee','Bhai','employee','employee@mail.com','111111111111111','$2b$10$KnmUHoeoZ9/2gRnA0mcKEemGq4PIFMN1Zu2yC.8nInHLHVjDCmifq','2021-02-12','1746761811044download (10).jpg','[\"1746761813901download (8).jpg\", \"1746761814083download.jpg\"]','active',NULL),(42,'DUMMAY','DUMMAY','DUMMAY','employee22@mail.com','4343','$2b$10$j.Uxu/VywpFwrEozLjtevORnw4w1x.Yy1G820ZIz2xdHlIzkEbfR2','2025-02-25','1746852098836avacado.jpg','[\"1746852093822small camera.jpg\", \"1746852092319watch.jpg\"]','active','2025-12-05'),(43,'DUMMY2','7FRTYHFT','DUMMY2','employee33333333@mail.com','56466','$2b$10$lDkqI6HkPexwIg0Lt7/Uo.8ljgWbVgs5AkxSd2Rse3AFqVB4zt4vu','1212-12-12','1746852203797download (6).jpg','[\"1746852207750download (22).jpg\"]','active','2025-11-11');
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
INSERT INTO `tbl_employee_attndence` VALUES (161,'35','08-05-2025','[{\"intime\": \"2025-05-08T07:11:29.147Z\", \"status\": 1, \"outtime\": \"2025-05-08T07:30:07.594Z\"}, {\"intime\": \"2025-05-08T07:30:07.594Z\", \"status\": 2, \"outtime\": \"2025-05-08T08:28:34.981Z\"}, {\"intime\": \"2025-05-08T08:28:34.981Z\", \"status\": 1, \"outtime\": \"2025-05-08T12:59:57.016Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}]','12:41:29 PM','06:29:57 PM','0:58:27','04:50:00','04:20:00','05:48:27','192.168.1.2','192.168.1.2','FD','P','','',NULL),(162,'32','08-05-2025','[{\"intime\": \"2025-05-08T07:12:16.125Z\", \"status\": 1, \"outtime\": \"2025-05-08T07:31:24.780Z\"}, {\"intime\": \"2025-05-08T07:31:24.780Z\", \"status\": 2, \"outtime\": \"2025-05-08T08:36:31.564Z\"}, {\"intime\": \"2025-05-08T08:36:31.564Z\", \"status\": 1, \"outtime\": \"2025-05-08T12:59:41.162Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}, {\"intime\": \"2025-05-08T12:59:43.286Z\", \"status\": 1, \"outtime\": \"2025-05-08T12:59:46.627Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}]','12:42:16 PM','06:29:46 PM','1:5:6','04:42:20','04:12:20','05:47:26','192.168.1.2','192.168.1.2','FD','P','','',NULL),(163,'34','08-05-2025','[{\"intime\": \"2025-05-08T07:13:14.772Z\", \"status\": 1, \"outtime\": \"2025-05-08T07:30:59.406Z\"}, {\"intime\": \"2025-05-08T07:30:59.406Z\", \"status\": 2, \"outtime\": \"2025-05-08T08:29:02.464Z\"}, {\"intime\": \"2025-05-08T08:29:02.464Z\", \"status\": 1, \"outtime\": \"2025-05-08T12:59:42.486Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}]','12:43:14 PM','06:29:42 PM','0:58:3','04:48:24','04:18:24','05:46:27','192.168.1.2','192.168.1.2','FD','P','','',NULL),(164,'36','08-05-2025','[{\"intime\": \"2025-05-08T07:13:37.237Z\", \"status\": 1, \"outtime\": \"2025-05-08T07:30:01.129Z\"}, {\"intime\": \"2025-05-08T07:30:01.129Z\", \"status\": 2, \"outtime\": \"2025-05-08T08:34:51.881Z\"}, {\"intime\": \"2025-05-08T08:34:51.882Z\", \"status\": 1, \"outtime\": \"2025-05-08T12:59:45.201Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}]','12:43:37 PM','06:29:45 PM','1:4:50','04:41:16','04:11:16','05:46:06','192.168.1.2','192.168.1.2','FD','P','','',NULL),(165,'33','08-05-2025','[{\"intime\": \"2025-05-08T07:13:53.502Z\", \"status\": 1, \"outtime\": \"2025-05-08T07:31:26.385Z\"}, {\"intime\": \"2025-05-08T07:31:26.385Z\", \"status\": 2, \"outtime\": \"2025-05-08T08:30:45.995Z\"}, {\"intime\": \"2025-05-08T08:30:45.995Z\", \"status\": 1, \"outtime\": \"2025-05-08T12:59:52.525Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}]','12:43:53 PM','06:29:52 PM','0:59:19','04:46:38','04:16:38','05:45:57','192.168.1.2','192.168.1.2','FD','P','','',NULL),(166,'39','08-05-2025','[{\"intime\": \"2025-05-08T07:15:41.199Z\", \"status\": 1, \"outtime\": \"2025-05-08T07:30:55.620Z\"}, {\"intime\": \"2025-05-08T07:30:55.620Z\", \"status\": 2, \"outtime\": \"2025-05-08T08:41:56.343Z\"}, {\"intime\": \"2025-05-08T08:41:56.343Z\", \"status\": 1, \"outtime\": \"2025-05-08T13:00:19.059Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}]','12:45:41 PM','06:30:19 PM','1:11:0','04:33:36','04:03:36','05:44:36','192.168.1.2','192.168.1.2','FD','P','','',NULL),(167,'40','08-05-2025','[{\"intime\": \"2025-05-08T07:15:43.490Z\", \"status\": 1, \"outtime\": \"2025-05-08T07:30:48.973Z\"}, {\"intime\": \"2025-05-08T07:30:48.973Z\", \"status\": 2, \"outtime\": \"2025-05-08T08:41:52.958Z\"}, {\"intime\": \"2025-05-08T08:41:52.958Z\", \"status\": 1, \"outtime\": \"2025-05-08T13:00:06.599Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}]','12:45:43 PM','06:30:06 PM','1:11:3','04:33:18','04:03:18','05:44:21','192.168.1.2','192.168.1.2','FD','P','','',NULL),(168,'38','08-05-2025','[{\"intime\": \"2025-05-08T07:17:44.321Z\", \"status\": 1, \"outtime\": \"2025-05-08T07:30:09.919Z\"}, {\"intime\": \"2025-05-08T07:30:09.919Z\", \"status\": 2, \"outtime\": \"2025-05-08T08:28:38.202Z\"}, {\"intime\": \"2025-05-08T08:28:38.202Z\", \"status\": 1, \"outtime\": \"2025-05-08T13:00:11.788Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}]','12:47:44 PM','06:30:11 PM','0:58:28','04:43:58','04:13:58','05:42:26','192.168.1.2','192.168.1.2','FD','P','','',NULL),(169,'37','08-05-2025','[{\"intime\": \"2025-05-08T07:18:12.515Z\", \"status\": 1, \"outtime\": \"2025-05-08T07:30:53.814Z\"}, {\"intime\": \"2025-05-08T07:30:53.814Z\", \"status\": 2, \"outtime\": \"2025-05-08T08:28:45.177Z\"}, {\"intime\": \"2025-05-08T08:28:45.177Z\", \"status\": 1, \"outtime\": \"2025-05-08T13:00:24.555Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}, {\"intime\": \"2025-05-08T13:00:25.461Z\", \"status\": 1, \"outtime\": \"2025-05-08T13:00:27.906Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}]','12:48:12 PM','06:30:27 PM','0:57:51','04:44:22','04:14:22','05:42:13','192.168.1.2','192.168.1.2','FD','P','','',NULL),(170,'37','09-05-2025','[{\"intime\": \"2025-05-09T03:35:02.515Z\", \"status\": 1, \"outtime\": \"2025-05-09T07:23:09.316Z\"}, {\"intime\": \"2025-05-09T07:23:09.316Z\", \"status\": 2, \"outtime\": \"2025-05-09T07:23:23.540Z\"}, {\"intime\": \"2025-05-09T07:23:23.540Z\", \"status\": 1, \"outtime\": \"2025-05-09T07:30:28.050Z\"}, {\"intime\": \"2025-05-09T07:30:28.050Z\", \"status\": 2, \"outtime\": \"2025-05-09T08:27:15.432Z\"}, {\"intime\": \"2025-05-09T08:27:15.432Z\", \"status\": 1, \"outtime\": \"2025-05-09T13:02:29.434Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}]','09:05:02 AM','06:32:29 PM','0:57:1','08:30:25','08:00:25','09:27:26','192.168.1.2','192.168.1.2','FD','P','','',NULL),(171,'38','09-05-2025','[{\"intime\": \"2025-05-09T03:35:35.747Z\", \"status\": 1, \"outtime\": \"2025-05-09T03:37:11.183Z\"}, {\"intime\": \"2025-05-09T03:37:11.183Z\", \"status\": 2, \"outtime\": \"2025-05-09T07:22:56.034Z\"}, {\"intime\": \"2025-05-09T07:22:56.034Z\", \"status\": 1, \"outtime\": \"2025-05-09T08:55:10.525Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}]','09:05:35 AM','02:25:10 PM','3:45:44','01:33:49','01:03:49','05:19:33','192.168.1.2','192.168.1.2','FD','P','','',NULL),(172,'40','09-05-2025','[{\"intime\": \"2025-05-09T03:35:45.800Z\", \"status\": 1, \"outtime\": \"2025-05-09T07:31:21.584Z\"}, {\"intime\": \"2025-05-09T07:31:21.584Z\", \"status\": 2, \"outtime\": \"2025-05-09T08:27:33.489Z\"}, {\"intime\": \"2025-05-09T08:27:33.489Z\", \"status\": 1, \"outtime\": \"2025-05-09T13:02:45.628Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}]','09:05:45 AM','06:32:45 PM','0:56:11','08:30:47','08:00:47','09:26:58','192.168.1.2','192.168.1.2','FD','P','','',NULL),(173,'41','09-05-2025','[{\"intime\": \"2025-05-09T03:37:17.041Z\", \"status\": 1, \"outtime\": \"2025-05-09T03:37:45.517Z\"}, {\"intime\": \"2025-05-09T03:37:45.517Z\", \"status\": 2, \"outtime\": \"2025-05-09T03:42:17.628Z\"}, {\"intime\": \"2025-05-09T03:42:17.628Z\", \"status\": 1, \"outtime\": \"2025-05-09T03:45:46.748Z\"}, {\"intime\": \"2025-05-09T03:45:46.748Z\", \"status\": 2, \"outtime\": \"2025-05-09T03:45:47.923Z\"}, {\"intime\": \"2025-05-09T03:45:47.923Z\", \"status\": 1, \"outtime\": \"2025-05-09T04:10:24.372Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}, {\"intime\": \"2025-05-09T04:10:33.057Z\", \"status\": 1, \"outtime\": \"2025-05-09T04:51:02.777Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}, {\"intime\": \"2025-05-09T04:51:20.648Z\", \"status\": 1, \"outtime\": \"2025-05-09T04:51:50.569Z\"}, {\"intime\": \"2025-05-09T04:51:50.569Z\", \"status\": 2, \"outtime\": \"2025-05-09T04:51:52.310Z\"}, {\"intime\": \"2025-05-09T04:51:52.310Z\", \"status\": 1, \"outtime\": \"2025-05-09T05:45:12.508Z\"}, {\"intime\": \"2025-05-09T05:45:12.508Z\", \"status\": 2, \"outtime\": \"2025-05-09T05:45:13.906Z\"}, {\"intime\": \"2025-05-09T05:45:13.906Z\", \"status\": 1, \"outtime\": \"2025-05-09T14:00:00.000Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}]','09:07:17 AM','6:30:00 PM','0:4:36','10:17:39','09:47:39','10:22:15','192.168.1.2','192.168.1.2','FD','P','','',NULL),(174,'36','09-05-2025','[{\"intime\": \"2025-05-09T03:47:46.246Z\", \"status\": 1, \"outtime\": \"2025-05-09T13:02:40.909Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}]','09:17:46 AM','06:32:40 PM','00:00:00','09:14:54','08:44:54','09:14:54','192.168.1.2','192.168.1.2','FD','P','','',NULL),(175,'39','09-05-2025','[{\"intime\": \"2025-05-09T04:00:26.001Z\", \"status\": 1, \"outtime\": \"2025-05-09T07:31:36.785Z\"}, {\"intime\": \"2025-05-09T07:31:36.785Z\", \"status\": 2, \"outtime\": \"2025-05-09T08:27:21.385Z\"}, {\"intime\": \"2025-05-09T08:27:21.385Z\", \"status\": 1, \"outtime\": \"2025-05-09T13:02:29.266Z\"}, {\"intime\": \"\", \"status\": \"\", \"outtime\": \"\"}]','09:30:25 AM','06:32:29 PM','0:55:44','08:06:17','07:36:17','09:02:01','192.168.1.2','192.168.1.2','FD','P','','',NULL),(176,'38','10-05-2025','[{\"intime\": \"2025-05-10T03:34:36.436Z\", \"status\": 1, \"outtime\": \"2025-05-10T07:30:10.745Z\"}, {\"intime\": \"2025-05-10T07:30:10.745Z\", \"status\": 2, \"outtime\": \"2025-05-10T08:26:07.198Z\"}, {\"intime\": \"2025-05-10T08:26:07.198Z\", \"status\": 1, \"outtime\": \"\"}]','09:04:36 AM','','0:55:56','3:55:34','','','192.168.1.2','','FD','P','','',NULL),(177,'37','10-05-2025','[{\"intime\": \"2025-05-10T03:34:41.994Z\", \"status\": 1, \"outtime\": \"2025-05-10T07:30:29.158Z\"}, {\"intime\": \"2025-05-10T07:30:29.158Z\", \"status\": 2, \"outtime\": \"2025-05-10T08:26:09.928Z\"}, {\"intime\": \"2025-05-10T08:26:09.929Z\", \"status\": 1, \"outtime\": \"\"}]','09:04:41 AM','','0:55:40','3:55:47','','','192.168.1.2','','FD','P','','',NULL),(178,'36','10-05-2025','[{\"intime\": \"2025-05-10T03:35:16.812Z\", \"status\": 1, \"outtime\": \"2025-05-10T07:30:09.411Z\"}, {\"intime\": \"2025-05-10T07:30:09.411Z\", \"status\": 2, \"outtime\": \"2025-05-10T08:28:09.834Z\"}, {\"intime\": \"2025-05-10T08:28:09.834Z\", \"status\": 1, \"outtime\": \"\"}]','09:05:16 AM','','0:58:0','3:54:52','','','192.168.1.2','','FD','P','','',NULL),(179,'39','10-05-2025','[{\"intime\": \"2025-05-10T03:35:22.329Z\", \"status\": 1, \"outtime\": \"2025-05-10T03:36:57.779Z\"}, {\"intime\": \"2025-05-10T03:36:57.779Z\", \"status\": 2, \"outtime\": \"2025-05-10T04:38:05.904Z\"}, {\"intime\": \"2025-05-10T04:38:05.904Z\", \"status\": 1, \"outtime\": \"\"}]','09:05:22 AM','','1:1:8','0:1:35','','','192.168.1.2','','FD','P','','',NULL),(180,'41','10-05-2025','[{\"intime\": \"2025-05-10T03:38:51.583Z\", \"status\": 1, \"outtime\": \"\"}]','09:08:51 AM','','','','','','192.168.1.2','','FD','P','','',NULL),(181,'35','09-05-2025','{}','-','-','-','-','-','-','-','-','FD','A','5555','Paid','[]'),(182,'35','10-05-2025','[{\"intime\": \"2025-05-10T10:27:16.818Z\", \"status\": 1, \"outtime\": \"\"}]','03:57:16 PM','','','','','','192.168.1.2','','FD','P','','',NULL);
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

-- Dump completed on 2025-05-10 18:19:53
