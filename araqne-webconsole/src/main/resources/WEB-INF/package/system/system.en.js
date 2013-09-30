angular.module('localization', [])
.filter('i18n', ['en', function(localizedText) {
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
.value('en', {
	/* orgchart */
	'$S_str_RemoveOrganization': 'Delete Department',
	'$S_msg_RemoveOrganizationConfirmPre': 'Do you really want to delete ',
	'$S_msg_RemoveOrganizationConfirmPost': '?',
	'$S_str_Remove': 'Delete',
	'$S_str_Cancel': 'Cancel',
	'$S_str_NewUser': 'New User',
	'$S_str_Edit': 'Edit',
	'$S_str_SearchUser': 'Search',
	'$S_str_Done': 'Done',
	'$S_plr_User': ' user',
	'$S_plr_Users': ' users',
	'$S_msg_TotalUsersPre': 'Total ',
	'$S_msg_TotalUsersPost': '',
	'$S_msg_SearchedUsersPre': '',
	'$S_msg_SearchedUsersPost': ' found',
	'$S_msg_SelectedUsersPre': '',
	'$S_msg_SelectedUsersPost': ' selected',
	'$S_str_LoginName': 'Login Name',
	'$S_str_Name': 'Name',
	'$S_str_Organization': 'Company',
	'$S_msg_PleaseEnterLoginName': 'Type new login name',
	'$S_msg_LoginNameRequiredError': 'Login name is required.',
	'$S_msg_LoginNameUniqueError': 'Duplicated login name.',
	'$S_str_Close': 'Close',
	'$S_str_ChangePassword': 'Change password',
	'$S_str_Password': 'Password',
	'$S_msg_PasswordInadequacyError': 'Password should be 9 chars at least, and it should contain alphabet, number and special chars',
	'$S_str_PasswordRetype': 'Retype password',
	'$S_msg_PasswordMismatchError': 'Password mismatch.',
	'$S_msg_NameRequiredError': 'Name is required.',
	'$S_str_Title': 'Title',
	'$S_str_OrganizationUnit': 'Department',
	'$S_str_Unassigned': 'None',
	'$S_str_Email': 'E-mail',
	'$S_msg_EmailError': 'Invalid E-mail.',
	'$S_str_Description': 'Description',
	'$S_str_CreatedAt': 'Created at',
	'$S_str_UpdatedAt': 'Modified at',
	'$S_str_AdminSetting': 'Admin',
	'$S_str_Privilege': 'Level',
	'$S_str_TablePrivilege': 'Table Access',
	'$S_str_Table': 'Table',
	'$S_str_ReadPrivilege': 'Read',
	'$S_plr_Item': 'item',
	'$S_plr_Items': 'items',
	'$S_msg_AvailableTableCount': 'Total {0} tables',
	'$S_msg_AvailableTableCountMore': 'Load more {0} tables..',
	'$S_str_RemoveThisUser': 'Delete this user',
	'$S_msg_RemoveThisUser': 'Change password of {0}',
	'$S_str_Change': 'Apply',
	'$S_str_RemoveUser': 'Delete User',
	'$S_msg_RemoveUserConfirmPre': 'Do you really want to delete user ',
	'$S_msg_RemoveUserConfirmPost': '?',
	'$S_msg_MoveSuccess': 'Moved successfully.',

	'$S_msg_RemoveUserAuthError': 'Cannot delete user {0}. Higher privilege is required.',
	'$S_msg_RemoveUserSuccessPartially': 'Deleted user {0} successfully.<br>Cannot delete user {1}. Higher privilege is required.',
	'$S_msg_RemoveUserSuccess': 'Deleted user {0} successfully.',
	'$S_msg_MoveUserError': 'Cannot move {0} to {1}. Higher privilege is required.',
	'$S_msg_MoveUserSuccess': 'Moved {0} to {1}',
	'$S_msg_MoveUserSuccessPartially': 'Moved {0} to {1}.<br>Failed to move {2}. Higher privilege is required.',
	'$S_msg_ChangePasswordSuccess': 'User {0}\'s password is changed successfully.',
	'$S_str_AllUsers': 'All Users',

	/* Dashboard */
	'$S_str_NewPreset': 'New preset',
	'$S_str_BlankPreset': 'New preset',
	'$S_str_SavePresetAs': 'Save as',
	'$S_str_LoadPreset': 'Load preset',
	'$S_str_RemoveThisPreset': 'Delete this preset',
	'$S_str_RemoveAllWidgets': 'Delete all widgets',
	'$S_str_AddWidget': 'Add new widget',
	'$S_msg_RemoveAllWidgets': 'All widgets in this preset will be deleted. Are you sure?',
	'$S_str_RemovePreset': 'Delete Preset',
	'$S_msg_RemovePresetConfirmPre': 'Do you really want to delete preset ',
	'$S_msg_RemovePresetConfirmPost': '?',

	'$S_str_SelectWidgetType': 'Select Widget Type',
	'$S_msg_SelectWidgetType': 'Select type of new widget.',
	'$S_str_Chart': 'Chart',
	'$S_str_Next': 'Next',
	'$S_str_Previous': 'Previous',
	'$S_str_QueryData': 'Data Query',
	'$S_msg_QueryData': 'Query is required for widget preview. Type query commands.',
	'$S_str_SelectAndReorderColumn': 'Column Layout',
	'$S_msg_SelectAndReorderColumn': 'Select and reorder columns using mouse click and drag & drop.',
	'$S_str_WidgetCommonSetting': 'Widget Configuration',
	'$S_msg_WidgetCommonSetting': 'Type widget title and refresh interval.',
	'$S_str_Interval': 'Interval',
	'$S_str_Second': 'sec',
	'$S_str_Seconds': 'secs',
	'$S_str_BindingDataToChart': 'Chart Data Binding',
	'$S_msg_SelectChartType': 'Select chart type',
	'$S_str_BarChart': 'Bar',
	'$S_str_LineChart': 'Line',
	'$S_str_PieChart': 'Pie',
	'$S_msg_SelectColumn': 'Select a column.',
	'$S_msg_NoSelectableColumn': 'Do you want to specify a column manually?',
	'$S_msg_SelectableColumn': 'Specify column name and type.',
	'$S_str_ColumnName': 'Column Name',
	'$S_str_ColumnType': 'Column Type',
	'$S_str_AddAndSelectColumn': 'Add column',
	'$S_str_AddSeries': 'Add Series',
	'$S_str_Value': 'Value',
	'$S_str_Label': 'Label',
	'$S_str_AxisX': 'X axis',

	'$S_str_Autosave': 'Auto Save',
	'$S_msg_SavePresetAs': 'Type preset name.',
	'$S_msg_NewPresetName': 'Type new preset name.',
	'$S_str_Number': 'Number',
	'$S_str_DateTime': 'Date',
	'$S_str_String': 'String',
	'$S_str_Series': 'Series',
	'$S_msg_SelectOneMoreNumberType': 'Select one or more number columns.',
	
	/* Widget */
	'$S_msg_QueryRunCount': 'Updated {0} times',
	'$S_msg_QueryRunInterval': 'Run every {0}secs',
	'$S_msg_UnknownError': 'Unknown Error',
	'$S_msg_OccurError': 'Error occurred',

	/* Starter */
	'$S_str_LogTrend': 'Log Trend',
	'$S_str_AlertTrend': 'Alert Trend',
	'$S_str_DiskPartition': 'Disk Partition',
	'$S_str_Usage': 'Usage',
	'$S_str_All': 'All',
	'$S_str_Partition': 'Partition',
	'$S_msg_AddLogger': 'Click \'Manage Loggers\' to start archive log.',
	'$S_str_ManageLogger': 'Manage Loggers',

	/* Login */
	'$S_str_ID': 'ID',
	'$S_str_Login': 'Login',
	'$S_str_Logout': 'Logout',
	'$S_msg_LoginErrorAdminNotFound': 'Login failed, User not found',
	'$S_msg_LoginErrorInvalidPassword': 'Login failed, Invalid password.',
	'$S_msg_LoginErrorInvalidOtpPassword': 'Login failed. Invalid OTP password.',
	'$S_msg_LoginErrorExpiredPassword': 'Login failed. Password expired.',
	'$S_msg_LoginErrorNotTrustHost': 'Login failed. The current location does not have access to server.',
	'$S_msg_LoginErrorLockedAdmin': 'Login failed. Account is locked.',
	'$S_msg_LoginConfirmMaxSession': 'Exceeds concurrent users. User {1} is logged in from {0}. Do you want to terminate current connection?',

	'$S_msg_SessionExpired': 'Session expired. Login please.',
	'$S_msg_NeedLogin': 'Login required',

	/* Common */
	'$S_str_First': 'First',
	'$S_str_Last': 'Last',
	'$S_str_MovePage': 'Jump page',
	'$S_str_Go': 'Go',
	'$S_str_Browser': 'Browse',
	'$S_msg_QueryHere': 'Query here',
	'$S_str_Search': 'Run',
	'$S_str_Stop': 'Stop',
	'$S_msg_WrongQuery': 'Invalid query. Please check permission and syntax',
	'$S_msg_MoreColumn': 'More {0} columns..',
	'$S_str_NewGroup': 'New Group',
	'$S_str_Rename': 'Rename',
	'$S_str_Remove': 'Delete',
});

