import os
from datetime import datetime, timedelta

from flask_apscheduler import APScheduler


class CleanupScheduler:
    def __init__(self, app=None):
        self.app = app
        self.scheduler = APScheduler()
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        self.app = app
        self.scheduler.init_app(app)
        self.scheduler.start()

        self.scheduler.add_job(
            id="cleanup_images",
            func=self.cleanup_expired_images,
            trigger="interval",
            minutes=10,
        )

    def cleanup_expired_images(self):
        with self.app.app_context():
            upload_dir = self.app.config["UPLOAD_FOLDER"]
            current_time = datetime.now()
            cleaned_count = 0

            try:
                for filename in os.listdir(upload_dir):
                    file_path = os.path.join(upload_dir, filename)

                    if ".." in file_path or not os.path.exists(file_path):
                        continue

                    file_modified = datetime.fromtimestamp(os.path.getmtime(file_path))

                    if filename.startswith("nobg_"):
                        expiration_time = timedelta(minutes=10)
                    elif filename.startswith("temp_"):
                        expiration_time = timedelta(hours=1)
                    else:
                        continue

                    if current_time - file_modified > expiration_time:
                        try:
                            os.remove(file_path)
                            cleaned_count += 1
                        except (OSError, IOError):
                            continue

                if cleaned_count:
                    self.app.logger.info(f"Cleaned up {cleaned_count} expired files")
            except Exception as e:
                self.app.logger.error(f"Cleanup error: {str(e)}")

    def cleanup_specific_files(self, prefix, max_age_minutes):
        with self.app.app_context():
            upload_dir = self.app.config["UPLOAD_FOLDER"]
            current_time = datetime.now()
            cleaned_count = 0

            for filename in os.listdir(upload_dir):
                if filename.startswith(prefix):
                    file_path = os.path.join(upload_dir, filename)

                    if ".." in file_path or not os.path.exists(file_path):
                        continue

                    file_modified = datetime.fromtimestamp(os.path.getmtime(file_path))
                    if current_time - file_modified > timedelta(
                        minutes=max_age_minutes
                    ):
                        try:
                            os.remove(file_path)
                            cleaned_count += 1
                        except (OSError, IOError):
                            continue

            return cleaned_count
