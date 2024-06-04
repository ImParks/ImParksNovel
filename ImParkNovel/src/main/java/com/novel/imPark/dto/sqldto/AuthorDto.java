package com.novel.imPark.dto.sqldto;


import java.time.LocalDateTime;

import com.novel.imPark.dto.eum.AuthorityEnum;

import lombok.Data;

@Data
public class AuthorDto {

	private String userId;
	private AuthorityEnum authorState;
	private LocalDateTime authorCreatedAt;
	private LocalDateTime authorUpdatedAt;
	
}
