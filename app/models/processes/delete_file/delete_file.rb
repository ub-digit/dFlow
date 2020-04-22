class DeleteFile

  def self.run(job:, logger: QueueManager.logger, file_path:)

    if DfileApi.delete_file(file_path: file_path)
      return true
    else
      return false
    end

  end
end

