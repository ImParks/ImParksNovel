package com.novel.imPark.dto.sqldto;


import java.time.LocalDateTime;

import com.novel.imPark.dto.eum.UserStateEnum;

import lombok.Data;

@Data
public class BannedLogDto {
 
	
	private int bannedKey;
	private String userId;
	private String bannedReason;
	private LocalDateTime reasonDate;
	private int bannedContent;
	private UserStateEnum bannedState;
	private LocalDateTime bannedCreatedAt;
	private LocalDateTime bannedUpdatedAt;
	
	
}
