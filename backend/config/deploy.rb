# config valid only for current version of Capistrano

set :application, 'dFlow'
set :repo_url, 'https://github.com/ub-digit/dFlow.git'

set :rvm_ruby_version, '2.3.1'      # Defaults to: 'default'

# Returns config for current stage assigned in config/deploy.yml
def deploy_config
  @config ||= YAML.load_file("config/deploy.yml")
  stage = fetch(:stage)
  return @config[stage.to_s]
end

# Copied into /{app}/shared/config from respective sample file
set :linked_files, ['config/config_full.yml', 'config/database.yml']

server deploy_config['host'], user: deploy_config['user'], roles: ['app', 'db', 'web'], port: deploy_config['port']

set :deploy_to, deploy_config['path']

after "deploy:finishing", "extra_cmds:create_version_file"

set :default_env, {
    "PATH" => deploy_config['nvm_path'] + ":$PATH"
}

set :branch, 'master'

namespace :deploy do
  before "git:check", :alert_deploying_to_stage do
    on roles(:all) do |host|
      colors = SSHKit::Color.new($stdout)
      message = "You are about to deploy to #{fetch(:stage)}"
      if fetch(:stage) == :production
        info colors.colorize("\e[5m#{message}!\e[0m", :red)
      end
    end
  end
end
