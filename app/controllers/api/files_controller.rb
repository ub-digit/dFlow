class Api::FilesController < Api::ApiController
  before_filter -> { validate_rights 'manage_jobs' }

  api!
  def index
    job_id = params[:job_id]
    job = Job.find_by_id(job_id)
    if job.nil?
      error_msg(ErrorCodes::OBJECT_ERROR, "Could not find job '#{params[:job_id]}'")
      render_json
      return false
    end
    @response[:files] = job.files_list
    render_json
  end
end