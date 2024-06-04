package com.novel.imPark.dto.sqldto;


import java.time.LocalDateTime;

import com.novel.imPark.dto.eum.StateEnum;

import lombok.Data;

@Data
public class NovelDto {

	private int novelKey;
	private String userId;
	private String novelTitle;
	private String novelTitleChoseong;
	private String novelIntroduction;
	private String coverImg;
	private StateEnum novelState;
	private LocalDateTime novelCreatedAt;
	private LocalDateTime lastUploadTime;
	private LocalDateTime novelUpdatedAt;
	
	
}
