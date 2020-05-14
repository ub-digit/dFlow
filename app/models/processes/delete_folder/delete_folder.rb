class DeleteFolder

   def self.run(job:, logger: QueueManager.logger, folder_path:)
    if DfileApi.delete_folder(folder_path: folder_path)
      return true
    else
      return false
    end
  end

end
