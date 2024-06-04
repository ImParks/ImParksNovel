package com.novel.imPark.dto.sqldto;


import java.time.LocalDateTime;

import com.novel.imPark.dto.eum.ReferenceTypeEnum;

import lombok.Data;

@Data
public class AlarmLogDto {

	private int alarmKey;
	private String userId;
	private ReferenceTypeEnum alarmReferenceType;
	private String postTitle;
	private String postContent;
	private int postHit;
	private LocalDateTime postCreatedAt;
	private LocalDateTime postUpdatedAt;
	
}
