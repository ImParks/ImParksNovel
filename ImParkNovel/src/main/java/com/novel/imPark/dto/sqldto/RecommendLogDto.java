package com.novel.imPark.dto.sqldto;


import java.time.LocalDateTime;

import com.novel.imPark.dto.eum.RecommendEnum;
import com.novel.imPark.dto.eum.ReferenceTypeEnum;

import lombok.Data;

@Data
public class RecommendLogDto {

	private int recommendKey;
	private ReferenceTypeEnum recommendReferenceType;
	private int recommendReferenceKey;
	private String userId;
	private RecommendEnum recommend;
	private LocalDateTime recommendCreatedAt;
	private LocalDateTime recommendUpdatedAt;
}
