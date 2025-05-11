import * as path from 'path';

export const USER_CREATED_SUCCESSFULLY = 'User Created Successfully';
export const USER_CREATED = 'User Created Successfully';
export const FAILED_TO_CREATE_USER = 'Error Occured while creating user, kindly try again';
export const ERROR_OCCURED = 'Error Occured Performing this request';
export const USER_ACCOUNT_EXIST = 'Account with the specified email exists';
export const USER_DEACTIVATED = 'User has already been deactivated';
export const USER_ACCOUNT_DOES_NOT_EXIST = "You will get an email to reset your password if you have an account with us";
export const UNAUTHENTICATED_MESSAGE = 'User is currently unauthorized, kindly authenticate to continue';
export const EMAIL_VERIFIED_SUCCESSFULLY = 'Email verified successfully';
export const OTP_VERIFIED_SUCCESSFULLY = 'Otp verified successfully';
export const OTP_VERIFIED = 'OTP not verified for this operation';
export const INVALID_HEADER = 'Invalid or missing Authorization header';
export const TOKEN_NOT_PROVIDED = 'Token not provided in Authorization header';
export const ACCOUNT_INACTIVE = 'Account is inactive, please contact support';
export const USER_ACTIVATEED = 'User already active';


export const USER_NOT_FOUND = 'User not found!';
export const PROFILE_FOUND = 'Successfully fetched profile';
export const PROFILE_UPDATED = 'Successfully updated profile';
export const PROFILE_DELETED = 'Successfully deleted profile';
export const USER_PROFILE_NOT_FOUND = 'User profile not found';
export const PROFILE_NOT_FOUND = 'Profile not found';
export const INVALID_PASSWORD = 'Invalid password';
export const PASSWORD_CHANGE_FAILED = 'Failed to change password';
export const EMPLOYEE_NOT_FOUND = 'Employee not found';



export const BAD_REQUEST = 'Bad Request';

export const OK = 'Success';

export const UNAUTHORISED_TOKEN = 'Invalid token or email';

export const INVALID_CREDENTIALS = 'Invalid credentials';
export const LOGIN_SUCCESSFUL = 'Login successful';
export const LOGIN_ERROR = 'An error occurred during login';
export const EMAIL_SENT = 'Email sent successfully';

export const VERIFY_OTP_SENT = 'OTP sent for verification, please check your email';
export const SERVER_ERROR = 'Sorry a server error occured';
export const FORBIDDEN_ACTION = 'You dont have the permission to perform this action';
export const INVALID_OTP = 'Invalid or expired OTP';
export const EXPIRED_OTP = 'expired OTP';
export const FAILED_OTP = 'Failed to generate OTP';
export const NOT_ORG_OWNER = 'You do not have permission to update this organisation';
export const PASSWORD_UPDATED = 'Password updated successfully';
export const DUPLICATE_PASSWORD = 'New password cannot be the same as old password';
export const REQUEST_SUCCESSFUL = 'Request completed successfully';
export const INVALID_CURRENT_PWD = 'Current password is incorrect'
export const INVALID_REFRESH_TOKEN = 'Invalid refresh token';
export const ADMIN_ROLE_NOT_FOUND = 'Admin Role does not exist';
// export const PAYMENT_NOTFOUND = 'Payment plan not found';

export const ROLE_NOT_FOUND = 'Role not found in the organization';

export const NO_USER_ORGS = 'User has no organisations';

export const EMAIL_TEMPLATES = {
  TEMPLATE_UPDATED_SUCCESSFULLY: 'Template updated successfully',
  INVALID_HTML_FORMAT: 'Invalid HTML format',
  TEMPLATE_NOT_FOUND: 'Template not found',
};
export const EXISTING_ROLE = 'A role with this name already exists in the organisation';
export const ACCESS_DENIED = 'Access denied: Admin privileges required';

export const ROLE_FETCHED_SUCCESSFULLY = 'Roles fetched successfully';
export const ROLE_CREATED_SUCCESSFULLY = 'Role created successfully';

export const RESOURCE_NOT_FOUND = (resource) => {
  return `${resource} does not exist`;
};
export const INVALID_UUID_FORMAT = 'Invalid UUID format';

export const USER_NOT_REGISTERED = 'User not found, register to continue';

export const INVALID_USER_ID = 'Provide a valid user Id';

export const MAX_PROFILE_PICTURE_SIZE = 2 * 1024 * 1024;
export const VALID_UPLOADS_MIME_TYPES = ['image/jpeg', 'image/png'];
export const BASE_URL = 'https://';
export const PROFILE_PHOTO_UPLOADS = path.join(__dirname, '..', 'uploads');
export const NO_FILE_FOUND = 'No file uploaded.';
export const PROFILE_PIC_NOT_FOUND = 'Previous profile picture pic not found';
export const PROFILE_PIC_ERROR = 'Error deleting previous profile picture:';
export const FILE_SAVE_ERROR = 'Error saving file to disk';
export const PICTURE_UPDATED = 'Profile picture updated successfully';
export const ERROR_DIRECTORY = 'Error creating uploads directory:';
export const DIRECTORY_CREATED = 'Uploads directory created at:';

export const FILE_EXCEEDS_SIZE = (resource) => {
  return `File size exceeds ${resource} MB limit`;
};
export const INVALID_FILE_TYPE = (resource) => {
  return `Invalid file type. Allowed types: ${resource}`;
};

export const ACCESS_DENIED_USER_PROFILE = 'Access denied: You can only view your own user profile';
export const ACCESS_DENIED_USER_UPDATE = 'Access denied: You can only update your own user profile';
