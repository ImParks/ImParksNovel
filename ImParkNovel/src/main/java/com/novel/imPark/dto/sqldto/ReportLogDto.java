package com.novel.imPark.dto.sqldto;


import java.time.LocalDateTime;

import com.novel.imPark.dto.eum.ReferenceTypeEnum;

import lombok.Data;

@Data
public class ReportLogDto {
	
	private int reportKey;
	private String userId;  //신고 받은아이디
	private String reportId;  //신고 한 아이디
	private ReferenceTypeEnum reportReferenceType;
	private String reportCategory;
	private String reportContent;
	private LocalDateTime reportCreatedAt;
	private LocalDateTime reportUpdatedAt;
}
