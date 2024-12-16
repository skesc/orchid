import os
import random
import time
from typing import Optional

from config import Config
from httpx import Client
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

# huge thx to https://github.com/trevorhobenshield/twitter-api-client

# Constants
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.3",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
]


class TwitterScraper:
    def __init__(self, auth_token: str = None, ct0: str = None):
        # first try to use provided tokens
        if auth_token and ct0:
            self.auth_token = auth_token
            self.ct0 = ct0
        # then try to use tokens from environment
        elif Config.TWITTER_AUTH_TOKEN and Config.TWITTER_CT0:
            self.auth_token = Config.TWITTER_AUTH_TOKEN
            self.ct0 = Config.TWITTER_CT0
        # finally, get new tokens if none are available
        else:
            self.auth_token, self.ct0 = self._renew_tokens()

        self.session = self._create_session(self.auth_token, self.ct0)

    def _renew_tokens(self) -> tuple[str, str]:
        # TODO: actually test this, twitter thinks i'm a bot for now so can't test it
        options = webdriver.ChromeOptions()
        options.add_experimental_option("excludeSwitches", ["enable-automation"])

        if Config.ENV != "dev":
            options.add_argument("--headless=new")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-gpu")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--log-level=3")
            driver = webdriver.Remote(
                command_executor="http://selenium:4444/wd/hub", options=options
            )
        else:
            driver = webdriver.Chrome(options=options)

        try:
            driver.get("https://x.com/i/flow/login")

            username_input = WebDriverWait(driver, 20).until(
                EC.visibility_of_element_located(
                    (By.CSS_SELECTOR, 'input[autocomplete="username"]')
                )
            )
            username_input.send_keys(Config.TWITTER_USERNAME)
            username_input.send_keys(Keys.ENTER)

            password_input = WebDriverWait(driver, 10).until(
                EC.visibility_of_element_located(
                    (By.CSS_SELECTOR, 'input[name="password"]')
                )
            )
            password_input.send_keys(Config.TWITTER_PASSWORD)
            password_input.send_keys(Keys.ENTER)

            time.sleep(5)
            cookies = driver.get_cookies()
            auth_token = next(
                (c["value"] for c in cookies if c["name"] == "auth_token"), None
            )
            ct0 = next((c["value"] for c in cookies if c["name"] == "ct0"), None)

            if not auth_token or not ct0:
                raise Exception("Failed to obtain Twitter tokens")

            # TODO: upadte to store tokens in a separate file?
            os.environ["TWITTER_AUTH_TOKEN"] = auth_token
            os.environ["TWITTER_CT0"] = ct0

            return auth_token, ct0

        finally:
            driver.quit()

    def _create_session(self, auth_token: str, ct0: str) -> Client:
        session = Client(
            cookies={"auth_token": auth_token, "ct0": ct0},
            headers=self._get_headers(auth_token, ct0),
            follow_redirects=True,
        )
        return session

    def _get_headers(self, auth_token: str, ct0: str) -> dict:
        return {
            "authorization": "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs=1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
            "cookie": f"auth_token={auth_token}; ct0={ct0}",
            "referer": "https://twitter.com/",
            "user-agent": random.choice(USER_AGENTS),
            "x-csrf-token": ct0,
            "x-twitter-auth-type": "OAuth2Session",
            "x-twitter-active-user": "yes",
            "x-twitter-client-language": "en",
        }

    def get_user_by_username(self, username: str) -> Optional[dict]:
        variables = {"screen_name": username}
        default_features = {
            # new
            "c9s_tweet_anatomy_moderator_badge_enabled": True,
            "responsive_web_home_pinned_timelines_enabled": True,
            "blue_business_profile_image_shape_enabled": True,
            "creator_subscriptions_tweet_preview_api_enabled": True,
            "freedom_of_speech_not_reach_fetch_enabled": True,
            "graphql_is_translatable_rweb_tweet_is_translatable_enabled": True,
            "graphql_timeline_v2_bookmark_timeline": True,
            "hidden_profile_likes_enabled": True,
            "highlights_tweets_tab_ui_enabled": True,
            "interactive_text_enabled": True,
            "longform_notetweets_consumption_enabled": True,
            "longform_notetweets_inline_media_enabled": True,
            "longform_notetweets_rich_text_read_enabled": True,
            "longform_notetweets_richtext_consumption_enabled": True,
            "profile_foundations_tweet_stats_enabled": True,
            "profile_foundations_tweet_stats_tweet_frequency": True,
            "responsive_web_birdwatch_note_limit_enabled": True,
            "responsive_web_edit_tweet_api_enabled": True,
            "responsive_web_enhance_cards_enabled": False,
            "responsive_web_graphql_exclude_directive_enabled": True,
            "responsive_web_graphql_skip_user_profile_image_extensions_enabled": False,
            "responsive_web_graphql_timeline_navigation_enabled": True,
            "responsive_web_media_download_video_enabled": False,
            "responsive_web_text_conversations_enabled": False,
            "responsive_web_twitter_article_data_v2_enabled": True,
            "responsive_web_twitter_article_tweet_consumption_enabled": False,
            "responsive_web_twitter_blue_verified_badge_is_enabled": True,
            "rweb_lists_timeline_redesign_enabled": True,
            "spaces_2022_h2_clipping": True,
            "spaces_2022_h2_spaces_communities": True,
            "standardized_nudges_misinfo": True,
            "subscriptions_verification_info_verified_since_enabled": True,
            "tweet_awards_web_tipping_enabled": False,
            "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": True,
            "tweetypie_unmention_optimization_enabled": True,
            "verified_phone_label_enabled": False,
            "vibe_api_enabled": True,
            "view_counts_everywhere_api_enabled": True,
        }

        params = {"variables": variables, "features": default_features}

        url = (
            "https://twitter.com/i/api/graphql/sLVLhk0bGj3MVFEKTdax1w/UserByScreenName"
        )
        response = self.session.get(url, params=self._build_params(params))

        if response.status_code == 200:
            return response.json()
        return None

    def _build_params(self, params: dict) -> dict:
        return {k: self._json_dumps(v) for k, v in params.items()}

    def _json_dumps(self, obj) -> str:
        import json

        return json.dumps(obj, separators=(",", ":"))


def get_profile_image(
    username: str, auth_token: str = None, ct0: str = None
) -> Optional[str]:
    if not username:
        return None

    try:
        scraper = TwitterScraper(auth_token=auth_token, ct0=ct0)
        user_data = scraper.get_user_by_username(username)

        if not user_data or "data" not in user_data:
            # try once more with renewed tokens
            if auth_token and ct0:  # only retry if we were using old tokens
                scraper = TwitterScraper()  # this will trigger token renewal
                user_data = scraper.get_user_by_username(username)
                if not user_data or "data" not in user_data:
                    return None
            else:
                return None

        data = user_data["data"]
        user = data.get("user", {})
        result = user.get("result", {})
        legacy = result.get("legacy", {})

        # get profile image URL, replacing _normal with _400x400 for higher resolution
        profile_image = legacy.get("profile_image_url_https")
        if profile_image:
            return profile_image.replace("_normal.", "_400x400.")

        return None

    except Exception:
        return None
