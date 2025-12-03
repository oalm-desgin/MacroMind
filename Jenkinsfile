// MacroMind Root Jenkinsfile
// Detects changes and triggers appropriate service pipelines

pipeline {
    agent any
    
    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                    env.GIT_BRANCH_NAME = env.BRANCH_NAME ?: env.GIT_BRANCH
                }
            }
        }
        
        stage('Detect Changes') {
            steps {
                script {
                    // Get list of changed files
                    def changedFiles = sh(
                        script: '''
                            if [ "${GIT_PREVIOUS_SUCCESSFUL_COMMIT}" ]; then
                                git diff --name-only ${GIT_PREVIOUS_SUCCESSFUL_COMMIT} ${GIT_COMMIT}
                            else
                                git diff --name-only HEAD~1 HEAD
                            fi
                        ''',
                        returnStdout: true
                    ).trim()
                    
                    // Determine which services changed
                    env.AUTH_SERVICE_CHANGED = changedFiles.contains('services/auth-service/') ? 'true' : 'false'
                    env.MEAL_PLANNER_CHANGED = changedFiles.contains('services/meal-planner-service/') ? 'true' : 'false'
                    env.NUTRITION_AI_CHANGED = changedFiles.contains('services/nutrition-ai-service/') ? 'true' : 'false'
                    env.FRONTEND_CHANGED = changedFiles.contains('frontend/') ? 'true' : 'false'
                    
                    // If no specific changes detected, build all (manual trigger)
                    if (params.BUILD_ALL == true || changedFiles == '') {
                        env.AUTH_SERVICE_CHANGED = 'true'
                        env.MEAL_PLANNER_CHANGED = 'true'
                        env.NUTRITION_AI_CHANGED = 'true'
                        env.FRONTEND_CHANGED = 'true'
                    }
                    
                    echo "Changed Services:"
                    echo "  Auth Service: ${env.AUTH_SERVICE_CHANGED}"
                    echo "  Meal Planner: ${env.MEAL_PLANNER_CHANGED}"
                    echo "  Nutrition AI: ${env.NUTRITION_AI_CHANGED}"
                    echo "  Frontend: ${env.FRONTEND_CHANGED}"
                }
            }
        }
        
        stage('Build Auth Service') {
            when {
                expression { env.AUTH_SERVICE_CHANGED == 'true' }
            }
            steps {
                build job: 'macromind-auth-service', 
                      parameters: [
                          string(name: 'GIT_COMMIT', value: env.GIT_COMMIT),
                          string(name: 'GIT_COMMIT_SHORT', value: env.GIT_COMMIT_SHORT),
                          string(name: 'GIT_BRANCH', value: env.GIT_BRANCH_NAME)
                      ],
                      wait: true
            }
        }
        
        stage('Build Meal Planner Service') {
            when {
                expression { env.MEAL_PLANNER_CHANGED == 'true' }
            }
            steps {
                build job: 'macromind-meal-planner-service', 
                      parameters: [
                          string(name: 'GIT_COMMIT', value: env.GIT_COMMIT),
                          string(name: 'GIT_COMMIT_SHORT', value: env.GIT_COMMIT_SHORT),
                          string(name: 'GIT_BRANCH', value: env.GIT_BRANCH_NAME)
                      ],
                      wait: true
            }
        }
        
        stage('Build Nutrition AI Service') {
            when {
                expression { env.NUTRITION_AI_CHANGED == 'true' }
            }
            steps {
                build job: 'macromind-nutrition-ai-service', 
                      parameters: [
                          string(name: 'GIT_COMMIT', value: env.GIT_COMMIT),
                          string(name: 'GIT_COMMIT_SHORT', value: env.GIT_COMMIT_SHORT),
                          string(name: 'GIT_BRANCH', value: env.GIT_BRANCH_NAME)
                      ],
                      wait: true
            }
        }
        
        stage('Build Frontend') {
            when {
                expression { env.FRONTEND_CHANGED == 'true' }
            }
            steps {
                build job: 'macromind-frontend', 
                      parameters: [
                          string(name: 'GIT_COMMIT', value: env.GIT_COMMIT),
                          string(name: 'GIT_COMMIT_SHORT', value: env.GIT_COMMIT_SHORT),
                          string(name: 'GIT_BRANCH', value: env.GIT_BRANCH_NAME)
                      ],
                      wait: true
            }
        }
    }
    
    post {
        success {
            echo 'All service pipelines completed successfully!'
        }
        failure {
            echo 'One or more service pipelines failed. Check individual job logs.'
        }
        always {
            cleanWs()
        }
    }
}

