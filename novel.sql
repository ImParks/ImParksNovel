CREATE DATABASE novel default CHARACTER SET UTF8MB4;
use novel;
drop DATABASE novel;

CREATE TABLE `user` (
	`userId`	VARCHAR(30) PRIMARY KEY	NOT NULL,
	`userPw`	VARCHAR(255)	NOT NULL,
	`userNicname`	VARCHAR(30)	NOT NULL,
	`tag`	INT	NOT NULL	DEFAULT 0,
	`profileImg`	VARCHAR(100)	NOT NULL,
	`name`	VARCHAR(30)	NOT NULL,
	`gender`	enum('man','girl','undisclosed')	NOT NULL	DEFAULT 'undisclosed',
	`birthday`	VARCHAR(8)	NOT NULL,
	`email`	VARCHAR(30)	NOT NULL,
	`mobileNumver`	VARCHAR(11)	NOT NULL,
	`pwHint`	TINYINT	NOT NULL,
	`answer`	VARCHAR(100)	NOT NULL,
	`userState`	ENUM('activate','deactivate','secession')	NOT NULL	DEFAULT 'activate',
	`userCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`userUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE `author` (
	`userId`	VARCHAR(30) PRIMARY KEY	NOT NULL,
	`authorState`	ENUM('activate','deactivate')	NOT NULL	DEFAULT 'activate',
	`authorCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`authorUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE `inquiry` (
	`inquiryNumber`	INT PRIMARY KEY AUTO_INCREMENT	NOT NULL,
	`userId`	VARCHAR(30)	NOT NULL,
	`inquiryCategory`	VARCHAR(30)	NOT NULL,
	`inquiryText`	TEXT	NOT NULL,
	`inquiryCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`inquiryUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE `inquiryResponse` (
	`InquiryResponseNumver`	INT PRIMARY KEY AUTO_INCREMENT	NOT NULL,
	`inquiryNumber`	INT	NOT NULL,
	`adminId`	VARCHAR(30)	NOT NULL,
	`inquiryResponseText`	TEXT	NOT NULL,
	`inquiryResponseCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`inquiryResponseUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE `admin` (
	`adminId`	VARCHAR(30) PRIMARY KEY	NOT NULL,
	`adminPw`	VARCHAR(30)	NOT NULL,
	`adminNicname`	VARCHAR(30)	NOT NULL,
	`profileImg`	VARCHAR(100)	NOT NULL,
	`adminAuthority`	INT(1)	NOT NULL	DEFAULT '0',
	`adminState`	ENUM('activate','deactivate')	NOT NULL	DEFAULT 'activate',
	`adminCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`adminUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE `post` (
	`postKey`	INT PRIMARY KEY AUTO_INCREMENT	NOT NULL,
	`userId`	VARCHAR(30)	NOT NULL,
	`postCategory`	VARCHAR(50)	NOT NULL,
	`postTitle`	VARCHAR(50)	NOT NULL,
	`postContent`	TEXT	NOT NULL,
	`postHit`	INT	NOT NULL	DEFAULT 0,
	`postState`	ENUM('open','hide','delete','disabled')	NULL	DEFAULT 'open',
	`postCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`postUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE `episode` (
	`episodeKey`	INT PRIMARY KEY AUTO_INCREMENT	NOT NULL,
	`novelKey`	INT	NOT NULL,
	`episode`	INT	NOT NULL	DEFAULT 0,
	`category`	ENUM('announcement','episode')	NOT NULL,
	`episodetitle`	VARCHAR(50)	NOT NULL,
	`episodeContent`	TEXT	NOT NULL,
	`episodeHit`	INT	NOT NULL	DEFAULT 0,
	`AuthorNote`	VARCHAR(255)	NOT NULL,
	`episodeState`	enum('open','hide','delete','disabled')	NOT NULL	DEFAULT 'open',
	`novelCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`novelUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE `commentLog` (
	`commentKey`	INT PRIMARY KEY AUTO_INCREMENT	NOT NULL,
	`commentReferenceType`	ENUM('post','episode')	NOT NULL,
	`commentReferenceKey`	INT	NOT NULL,
	`userId`	VARCHAR(30)	NOT NULL,
	`comment`	VARCHAR(200)	NOT NULL,
	`commentState`	enum('open','hide','delete','disabled')	NOT NULL	DEFAULT 'open',
	`commentCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`commentUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);
drop table novel;
use novel;
CREATE TABLE `novel` (
	`novelKey`	INT PRIMARY KEY AUTO_INCREMENT	NOT NULL,
	`userId`	VARCHAR(30)	NOT NULL,
	`novelTitle`	VARCHAR(80)	NOT NULL,
	`novelTitleChoseong`	VARCHAR(80)	NOT NULL,
	`novelIntroduction`	VARCHAR(255)	NOT NULL,
	`coverImg`	VARCHAR(100)	NOT NULL,
	`novelState`	enum('open','hide','delete','disabled')	NOT NULL,
    `novelSeriesState`	enum('seriesProgress','seriesStop','serialDelayed.')	NOT NULL	DEFAULT 'seriesProgress',
	`novelCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`lastUploadTime`	DATETIME	NOT NULL DEFAULT NOW(),
	`novelUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE `favorites` (
	`favoritesKey`	INT PRIMARY KEY AUTO_INCREMENT	NOT NULL,
	`episodeKey`	INT	NOT NULL,
	`novelKey`	INT	NOT NULL,
	`userId`	VARCHAR(30)	NOT NULL,
	`episode`	INT	NOT NULL	DEFAULT 0,
	`favoritesCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`favoritesUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE `replyLog` (
	`replyKey`	INT PRIMARY KEY AUTO_INCREMENT	NOT NULL,
	`userId`	VARCHAR(30) PRIMARY KEY	NOT NULL,
	`commentKey`	INT	NOT NULL,
	`reply`	VARCHAR(200)	NOT NULL,
	`replyState`	enum('open','hide','delete','disabled')	NOT NULL	DEFAULT 'open',
	`replyCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`replyUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE `episodeRatingLog` (
	`episodeRatingLogKey`	INT PRIMARY KEY AUTO_INCREMENT	NOT NULL,
	`episodeKey`	INT	NOT NULL,
	`userId`	VARCHAR(30) PRIMARY KEY	NOT NULL,
	`episodeRating`	INT(3)	NOT NULL,
	`episodeCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`episodeUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE `recommendLog` (
	`recommendKey`	INT PRIMARY KEY AUTO_INCREMENT	NOT NULL,
	`recommendReferenceType`	ENUM('post','commentLog','replyLog')	NOT NULL,
	`recommendReferenceKey`	INT	NOT NULL,
	`userId`	VARCHAR(30)	NOT NULL,
	`recommend`	ENUM('like','hate')	NOT NULL,
	`recommendCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`recommendUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE `adminRating` (
	`adminRatingKey`	INT PRIMARY KEY AUTO_INCREMENT	NOT NULL,
	`InquiryResponseNumver`	INT	NOT NULL,
	`adminId`	VARCHAR(30)	NOT NULL,
	`userId`	VARCHAR(30)	NOT NULL,
	`adminRating`	INT(3)	NOT NULL,
	`review`	VARCHAR(200)	NULL,
	`adminRatingCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`adminRatingUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE `categoryCollect` (
	`categoryCollectKey`	INT PRIMARY KEY AUTO_INCREMENT	NOT NULL,
	`category`	VARCHAR(255)	NOT NULL,
	`categoryChoseong`	VARCHAR(255)	NOT NULL,
	`categoryCollectCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`categoryCollectUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE `novelCategory` (
	`novelCategoryKey`	INT PRIMARY KEY AUTO_INCREMENT	NOT NULL,
	`categoryCollectKey`	INT	NOT NULL,
	`novelKey`	INT	NOT NULL,
	`categoryCollectCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`categoryCollectUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE `adminLoginLog` (
	`adminLoginLogKey`	VARCHAR(255)	NOT NULL,
	`adminId`	VARCHAR(30) PRIMARY KEY	NOT NULL,
	`adminLoginLogCreatedAt`	DATETIME	NULL	DEFAULT NOW(),
	`adminLoginLogUpdatedAt`	DATETIME	NULL	DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE `alarmLog` (
	`alarmKey`	INT PRIMARY KEY AUTO_INCREMENT	NOT NULL,
	`userId`	VARCHAR(30)	NOT NULL,
	`alarmReferenceType` ENUM('post','commentLog','replyLog','novel') NOT NULL,
	`postTitle`	VARCHAR(50)	NOT NULL,
	`postContent`	TEXT	NOT NULL,
	`postHit`	INT	NOT NULL	DEFAULT 0,
	`postCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`postUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE `reportLog` (
	`reportKey`	INT PRIMARY KEY AUTO_INCREMENT	NOT NULL,
	`userId`	VARCHAR(30)	NOT NULL,
	`reportId`	VARCHAR(50)	NOT NULL,
	`reportReferenceType`	ENUM('post','commentLog','replyLog','novel')	NOT NULL,
	`reportCategory`	INT	NOT NULL	DEFAULT 0,
	`reportContent`	TEXT	NOT NULL,
	`reportCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`reportUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE `bannedLog` (
	`bannedKey`	INT PRIMARY KEY AUTO_INCREMENT	NOT NULL,
	`userId`	VARCHAR(30)	NOT NULL,
	`bannedReason`	VARCHAR(50)	NOT NULL,
	`reasonDate`	DATETIME	NOT NULL	DEFAULT NOW(),
	`bannedContent`	INT	NOT NULL,
	`bannedState`	ENUM('activate','deactivate','secession')	NOT NULL	DEFAULT 'activate',
	`bannedCreatedAt`	DATETIME	NOT NULL	DEFAULT NOW(),
	`bannedUpdatedAt`	DATETIME	NOT NULL	DEFAULT NOW() ON UPDATE NOW()
);