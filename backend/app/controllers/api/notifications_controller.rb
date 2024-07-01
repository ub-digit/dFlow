class Api::NotificationsController < Api::ApiController
  before_filter -> { validate_rights 'manage_jobs' }

  def index
    @response[:notifications] = {
      queue_manager_stopped: QueueManagerPid.can_start?,
      jobs_in_quarantine: Job.where(quarantined: true).count
    }
    render_json
  end
end
