-- 创建搜索历史表
-- Week 2 Day 6 新增

CREATE TABLE IF NOT EXISTS `search_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `keyword` VARCHAR(200) NOT NULL,
  `resultCount` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX `idx_userId` (`userId`),
  INDEX `idx_keyword` (`keyword`),
  INDEX `idx_createdAt` (`createdAt`),
  
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 添加全文索引到novels表（如果还没有）
ALTER TABLE `novels` 
ADD FULLTEXT INDEX `ft_title_summary` (`title`, `summary`);

COMMIT;

