angular.module('localization', [])
.filter('i18n', ['en-us', function(localizedText) {
	return function(text, args) {
		if(localizedText.hasOwnProperty(text)) {
			var str = localizedText[text];
			if(!!args) {
				args.forEach(function(arg,i) {
					var re = new RegExp('{[' + i + ']}');
					str = str.replace(re, arg);
				});
			}
			return str;
		}
		return text;
	};
}]);

angular.module('localization')
.value('en-us', {
	/* orgchart */
	'$S_str_RemoveOrganization': '부서 삭제',
	'$S_msg_RemoveOrganizationConfirmPre': '정말 부서 ',
	'$S_msg_RemoveOrganizationConfirmPost': '을 삭제하시겠습니까?',
	'$S_str_Remove': '삭제',
	'$S_str_Cancel': '취소',
	'$S_str_NewUser': '새 사용자',
	'$S_str_Edit': '편집',
	'$S_str_SearchUser': '사용자 검색',
	'$S_str_Done': '완료',
	'$S_plr_User': '명',
	'$S_plr_Users': '명',
	'$S_msg_TotalUsersPre': '총 ',
	'$S_msg_TotalUsersPost': '의 사용자',
	'$S_msg_SearchedUsersPre': '',
	'$S_msg_SearchedUsersPost': ' 검색됨',
	'$S_msg_SelectedUsersPre': '',
	'$S_msg_SelectedUsersPost': ' 선택됨',
	'$S_str_LoginName': '로그인 이름',
	'$S_str_Name': '이름',
	'$S_str_Organization': '부서',
	'$S_msg_PleaseEnterLoginName': '아이디를 입력하세요',
	'$S_msg_LoginNameRequiredError': '아이디는 반드시 필요합니다.',
	'$S_msg_LoginNameUniqueError': '이미 존재하는 아이디입니다.',
	'$S_str_Close': '닫기',
	'$S_str_ChangePassword': '암호 변경',
	'$S_str_Password': '암호',
	'$S_msg_PasswordInadequacyError': '암호는 9자 이상의 영문, 숫자, 특수문자 조합으로 만들어야 합니다.',
	'$S_str_PasswordRetype': '재입력',
	'$S_msg_PasswordMismatchError': '암호가 서로 일치하지 않습니다.',
	'$S_msg_NameRequiredError': '이름은 반드시 필요합니다.',
	'$S_str_Title': '직함',
	'$S_str_OrganizationUnit': '부서',
	'$S_str_Unassigned': '미지정',
	'$S_str_Email': 'E-mail',
	'$S_msg_EmailError': '올바른 E-mail 형식이 아닙니다.',
	'$S_str_Description': '설명',
	'$S_str_CreatedAt': '생성일',
	'$S_str_UpdatedAt': '수정일',
	'$S_str_AdminSetting': '관리자 설정',
	'$S_str_Privilege': '권한',
	'$S_str_TablePrivilege': '테이블 권한 설정',
	'$S_str_Table': '테이블',
	'$S_str_ReadPrivilege': '읽기 권한',
	'$S_plr_Item': '개',
	'$S_plr_Items': '개',
	'$S_msg_AvailableTableCount': '의 접근 가능한 테이블',
	'$S_msg_AvailableTableCountMore': '의 접근 가능한 테이블 더 보기',
	'$S_str_RemoveThisUser': '이 사용자 삭제',
	'$S_msg_RemoveThisUser': '{0}님의 암호를 변경합니다.',
	'$S_str_Change': '변경',
	'$S_str_RemoveUser': '사용자 삭제',
	'$S_msg_RemoveUserConfirmPre': '정말 사용자 ',
	'$S_msg_RemoveUserConfirmPost': '을 삭제하시겠습니까?',
	'$S_msg_MoveSuccess': '성공적으로 이동했습니다.',
	
	'$S_msg_RemoveUserAuthError': '사용자 {0}를 삭제할 수 없습니다. 더 높은 권한이 필요합니다.',
	'$S_msg_RemoveUserSuccessPartially': '사용자 {0}을 성공적으로 삭제했습니다.<br>사용자 {1}는 삭제하지 못했습니다. 더 높은 권한이 필요합니다.',
	'$S_msg_RemoveUserSuccess': '사용자 {0}을 성공적으로 삭제했습니다.',
	'$S_msg_MoveUserError': '사용자 {0}를 {1}로 이동할 수 없습니다. 더 높은 권한이 필요합니다.',
	'$S_msg_MoveUserSuccess': '사용자 {0}을 {1}로 이동했습니다.',
	'$S_msg_MoveUserSuccessPartially': '사용자 {0}을 {1}로 이동했습니다.<br>사용자 {2}는 이동하지 못했습니다. 더 높은 권한이 필요합니다.',
	'$S_msg_ChangePasswordSuccess': '사용자 {0}의 비밀번호를 변경했습니다.',
	'$S_str_AllUsers': '모든 사용자',

	/* Dashboard */
	'$S_str_NewPreset': '새 프리셋',
	'$S_str_BlankPreset': '빈 프리셋',
	'$S_str_SavePresetAs': '현재 프리셋을 다른 이름으로 저장',
	'$S_str_LoadPreset': '불러오기',
	'$S_str_RemoveThisPreset': '이 프리셋 삭제',
	'$S_str_RemoveAllWidgets': '모든 위젯 지우기',
	'$S_str_AddWidget': '새 위젯 추가',
	'$S_msg_RemoveAllWidgets': '이 프리셋의 모든 위젯이 지워집니다. 계속하시겠습니까?',
	'$S_str_RemovePreset': '프리셋 삭제',
	'$S_msg_RemovePresetConfirmPre': '프리셋 ',
	'$S_msg_RemovePresetConfirmPost': '을 삭제합니다. 계속하시겠습니까?',

	'$S_str_SelectWidgetType': '위젯 종류 선택',
	'$S_msg_SelectWidgetType': '추가할 위젯의 종류를 선택하십시오.',
	'$S_str_Chart': '차트',
	'$S_str_Next': '다음',
	'$S_str_Previous': '이전',
	'$S_str_QueryData': '데이터 쿼리',
	'$S_msg_QueryData': '쿼리한 데이터를 바탕으로 위젯을 생성합니다. 원하는 데이터를 쿼리하십시오.',
	'$S_str_SelectAndReorderColumn': '컬럼 선택 및 배치',
	'$S_msg_SelectAndReorderColumn': '위젯에 표시할 필드를 선택하고, 오른쪽 목록에서 드래그 &amp; 드롭하여 컬럼 순서를 조절하십시오.',
	'$S_str_WidgetCommonSetting': '위젯 공통 설정',
	'$S_msg_WidgetCommonSetting': '위젯의 이름과 실행 주기를 입력하십시오.',
	'$S_str_Interval': '실행 주기',
	'$S_str_Second': '초',
	'$S_str_Seconds': '초',
	'$S_str_BindingDataToChart': '차트 설정 및 데이터 선택',
	'$S_msg_SelectChartType': '차트 종류를 선택하십시오.',
	'$S_str_BarChart': '바',
	'$S_str_LineChart': '라인',
	'$S_str_PieChart': '파이',
	'$S_msg_SelectColumn': '컬럼을 선택하십시오.',
	'$S_msg_NoSelectableColumn': '차트에 표시하려는 컬럼이 없습니까?',
	'$S_msg_SelectableColumn': '컬럼을 직접 입력하여 선택할 수 있습니다.',
	'$S_str_ColumnName': '컬럼 이름',
	'$S_str_ColumnType': '컬럼 타입',
	'$S_str_AddAndSelectColumn': '컬럼 추가 및 선택',
	'$S_str_AddSeries': '시리즈 추가',
	'$S_str_Value': '값',
	'$S_str_Label': '라벨',
	'$S_str_AxisX': 'X축',

	'$S_str_Autosave': '자동 저장',
	'$S_msg_SavePresetAs': '저장할 새 프리셋 이름을 입력하세요',
	'$S_msg_NewPresetName': '새 프리셋 이름을 입력하세요',
	'$S_str_Number': '숫자',
	'$S_str_DateTime': '날짜',
	'$S_str_String': '문자열',
	'$S_str_Series': '시리즈',
	'$S_msg_SelectOneMoreNumberType': '하나 이상의 숫자 타입의 컬럼을 선택하십시오.',

	/* Starter */
	'$S_str_LogTrend': '로그 발생 추이',
	'$S_str_AlertTrend': '경보 발생 추이',
	'$S_str_DiskPartition': '디스크 파티션',
	'$S_str_Usage': '사용량',
	'$S_str_All': '전체',
	'$S_str_Partition': '파티션',
	'$S_msg_AddLogger': '로그 수집 설정을 추가하여 로그 수집을 시작하세요.',
	'$S_str_ManageLogger': '로그 수집 설정 관리',

	/* Login */
	'$S_str_ID': 'ID',
	'$S_str_Login': '로그인',
	'$S_str_Logout': '로그아웃',
	'$S_msg_LoginErrorAdminNotFound': '로그인에 실패했습니다. 사용자를 찾을 수 없습니다.',
	'$S_msg_LoginErrorInvalidPassword': '로그인에 실패했습니다. 암호가 틀립니다.',
	'$S_msg_LoginErrorInvalidOtpPassword': '로그인에 실패했습니다. OTP 암호가 틀립니다.',
	'$S_msg_LoginErrorExpiredPassword': '로그인에 실패했습니다. 암호가 만료되었습니다.',
	'$S_msg_LoginErrorNotTrustHost': '로그인에 실패했습니다. 신뢰할 수 없는 호스트입니다.',
	'$S_msg_LoginErrorLockedAdmin': '로그인에 실패했습니다. 사용자 계정이 잠겨있습니다.',
	'$S_msg_LoginConfirmMaxSession': '최대 동시 접속자 수를 초과했습니다. 현재 {0}에서 사용자 {1}이 접속중입니다. 강제로 연결을 끊고 접속하시겠습니까?'

});

