class DeleteFolder

   def self.run(job:, logger: QueueManager.logger, folder_path:)
    if DfileApi.move_folder_ind(source_dir: folder_path, dest_dir: "TRASH:/#{job.id}/#{Time.now.strftime("%Y%m%d-%H%M")}", flow_step: job.flow_step)
      return true
    else
      return false
    end
  end

end
