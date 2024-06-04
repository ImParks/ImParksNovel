package com.novel.imPark.dto.sqldto;


import java.time.LocalDateTime;

import com.novel.imPark.dto.eum.ReferenceTypeEnum;
import com.novel.imPark.dto.eum.StateEnum;

import lombok.Data;

@Data
public class CommentLogDto {

	private int commentKey; 
	private ReferenceTypeEnum commentReferenceType;
	private int commentReferenceKey;
	private String userId;
	private String comment;
	private StateEnum commentState;
	private LocalDateTime commentCreatedAt;
	private LocalDateTime commentUpdatedAt;
	
	
}
