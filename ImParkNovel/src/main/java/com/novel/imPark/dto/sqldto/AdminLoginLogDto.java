package com.novel.imPark.dto.sqldto;


import java.time.LocalDateTime;

import lombok.Data;

@Data
public class AdminLoginLogDto {

	
	private String adminLoginLogKey;
	private String adminId;
	private LocalDateTime adminLoginLogCreatedAt;
	private LocalDateTime adminLoginLogUpdatedAt;
	
	
	
}
