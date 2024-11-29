import os
from datetime import datetime, timedelta

from config import Config
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
            id="cleanup_nobg",
            func=self.cleanup_expired_files,
            trigger="interval",
            minutes=10,
        )

    def cleanup_expired_files(self):
        with self.app.app_context():
            upload_dir = Config.NOBG_UPLOAD_FOLDER
            current_time = datetime.now()
            cleaned_count = 0

            try:
                for filename in os.listdir(upload_dir):
                    if not filename.startswith("nobg_"):
                        continue

                    file_path = os.path.join(upload_dir, filename)
                    if not os.path.exists(file_path):
                        continue

                    file_modified = datetime.fromtimestamp(os.path.getmtime(file_path))
                    if current_time - file_modified > timedelta(minutes=10):
                        try:
                            os.remove(file_path)
                            cleaned_count += 1
                        except (OSError, IOError):
                            continue

                if cleaned_count:
                    self.app.logger.info(
                        f"Cleaned up {cleaned_count} expired nobg files"
                    )
            except Exception as e:
                self.app.logger.error(f"Cleanup error: {str(e)}")
