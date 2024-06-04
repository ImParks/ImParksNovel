package com.novel.imPark.dto.sqldto;


import java.time.LocalDateTime;

import com.novel.imPark.dto.eum.StateEnum;

import lombok.Data;

@Data
public class ReplyLogDto {
	private int replyKey;
	private String userId;
	private int commentKey;
	private String reply;
	private StateEnum replyState;
	private LocalDateTime replyCreatedAt;
	private LocalDateTime replyUpdatedAt;
}
