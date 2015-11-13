# Load the Rails application.
require File.expand_path('../application', __FILE__)

# Initialize the Rails application.
Rails.application.initialize!

ASClient::Frameworks::Rails::Filter.configure(
  :cas_base_url  => ENV["CAS_BASE_URL"],
  :login_url     => ENV["CAS_LOGIN_URL"],
  :logout_url    => ENV["CAS_LOGOUT_URL"],
  :validate_url  => ENV["CAS_VALIDATE_URL"],
  :username_session_key => :cas_user,
  :extra_attributes_session_key => :cas_extra_attributes,
  :enable_single_sign_out => true
  :service_url => ENV["SERVICE_URL"]
)
