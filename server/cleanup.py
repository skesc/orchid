from datetime import datetime, timedelta

from config import Config
from flask_apscheduler import APScheduler
from s3 import get_s3_client


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

    def parse_timestamp(self, key):
        try:
            timestamp = key.split("_")[0]
            return int(timestamp)
        except (IndexError, ValueError):
            return None

    def cleanup_expired_files(self):
        with self.app.app_context():
            try:
                s3 = get_s3_client()
                bucket = Config.S3_BUCKET
                current_time = datetime.now()
                cleaned_count = 0

                try:
                    response = s3.list_objects_v2(Bucket=bucket, Prefix="nobg/")
                except Exception as e:
                    self.app.logger.error(f"Failed to list S3 objects: {str(e)}")
                    return

                if "Contents" not in response:
                    return

                objects_to_delete = []
                for obj in response["Contents"]:
                    key = obj["Key"]
                    filename = key.split("/")[-1]  # get just the filename part

                    timestamp = self.parse_timestamp(filename)
                    if timestamp is None:
                        continue

                    file_time = datetime.fromtimestamp(timestamp)

                    if current_time - file_time > timedelta(minutes=10):
                        objects_to_delete.append({"Key": key})
                        cleaned_count += 1

                if objects_to_delete:
                    try:
                        s3.delete_objects(
                            Bucket=bucket, Delete={"Objects": objects_to_delete}
                        )
                        self.app.logger.info(
                            f"Cleaned up {cleaned_count} expired files from S3"
                        )
                    except Exception as e:
                        self.app.logger.error(
                            f"Failed to delete expired files from S3: {str(e)}"
                        )

            except Exception as e:
                self.app.logger.error(f"S3 cleanup error: {str(e)}")
