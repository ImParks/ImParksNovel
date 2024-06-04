package com.novel.imPark.dto.sqldto;


import java.time.LocalDateTime;

import com.novel.imPark.dto.eum.GenderEnum;
import com.novel.imPark.dto.eum.UserStateEnum;

import lombok.Data;

@Data
public class UserDto {
    private String userId;
    private String userPw;
    private String userNicname;
    private int tag;
    private String profileImg;
    private String name;
    private GenderEnum gender;
    private String birthday;
    private String email;
    private String mobileNumver;
    private int pwHint;
    private String answer;
    private UserStateEnum userState;
    private LocalDateTime userCreatedAt;
    private LocalDateTime userUpdatedAt;
}
