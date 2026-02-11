const message = {
  meta: {
    profileTitle: "프로필",
  },
  page: {
    heading: "프로필 설정",
    basicInfo: "기본 정보",
  },
  form: {
    newAvatar: "새 아바타",
    noEmail: "이메일 정보 없음",
    avatarHelp: "아바타를 클릭하여 새로운 아바타를 만들 수 있습니다",
    displayNameLabel: "닉네임",
    displayNamePlaceholder: "닉네임을 입력하세요",
    save: "변경 저장",
    saving: "저장 중...",
  },
  toast: {
    updateSuccess: "닉네임이 변경되었습니다.",
    updateFailed: "닉네임 변경 중 오류가 발생했습니다.",
  },
  validation: {
    displayNameRequired: "닉네임을 입력해주세요.",
    displayNameTooLong: "닉네임은 {max}자 이내여야합니다.",
    displayNameTaken: "중복된 닉네임입니다.",
    displayNameAvailable: "사용 가능한 닉네임입니다.",
  },
  errors: {
    displayNameRequired: "닉네임을 입력해주세요.",
    displayNameTaken: "이미 사용 중인 닉네임입니다.",
    avatarInvalid: "아바타 설정에 실패했습니다.",
    updateFailed: "프로필 변경에 실패했습니다.",
  },
};

export default message;
