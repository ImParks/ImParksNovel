package com.novel.imPark.dto.sqldto;


import java.time.LocalDateTime;

import com.novel.imPark.dto.eum.StateEnum;

import lombok.Data;

@Data
public class PostDto {
	
private int postKey;
private String userId;
private String postCategory;
private String postTitle;
private String postContent;
private int postHit;
private StateEnum postState;
private LocalDateTime postCreatedAt;
private LocalDateTime postUpdatedAt;

}
