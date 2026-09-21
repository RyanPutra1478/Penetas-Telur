"""
TETASCO CONNECT — PROFILE MANAGER
Mengelola profil peternak dan identitas lemari inkubator secara persisten:
- 1 Lemari mewakili 1 Akun Peternak
- Disimpan lokal di farmer_profile.json agar persisten saat reboot / offline
- Tersinkronisasi otomatis dengan akun user di Cloud Server (tetasco.my.id)
"""

import os
import json
import logging
from datetime import datetime

logger = logging.getLogger("ProfileManager")

PROFILE_FILE = os.path.join(os.path.dirname(__file__), "farmer_profile.json")

DEFAULT_PROFILE = {
    "tetasco_id": 1,
    "nama_lemari": "Tetasco 01 (Lemari Utama)",
    "nama_peternak": "Peternak Tetasco",
    "email": "peternak@tetasco.local",
    "no_hp": "0812-3456-7890",
    "nama_farm": "Farm Berkah Sejahtera",
    "lokasi": "Indonesia",
    "kapasitas": "1200 Butir",
    "status_lemari": "active",
    "last_updated": None
}

class ProfileManager:
    def __init__(self):
        self.profile = self._load_profile()

    def _load_profile(self) -> dict:
        if os.path.exists(PROFILE_FILE):
            try:
                with open(PROFILE_FILE, "r") as f:
                    data = json.load(f)
                    res = dict(DEFAULT_PROFILE)
                    res.update(data)
                    return res
            except Exception as e:
                logger.warning("Gagal membaca farmer_profile.json: %s", e)
        return dict(DEFAULT_PROFILE)

    def _save_profile(self):
        try:
            self.profile["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            with open(PROFILE_FILE, "w") as f:
                json.dump(self.profile, f, indent=2)
        except Exception as e:
            logger.error("Gagal menyimpan farmer_profile.json: %s", e)

    def get_profile(self) -> dict:
        return dict(self.profile)

    def update_profile(self, new_data: dict) -> dict:
        allowed_fields = [
            "nama_lemari", "nama_peternak", "email",
            "no_hp", "nama_farm", "lokasi", "kapasitas"
        ]
        for field in allowed_fields:
            if field in new_data and new_data[field] is not None:
                self.profile[field] = str(new_data[field]).strip()
        self._save_profile()
        logger.info("Profil Peternak & Lemari diperbarui: %s (%s)",
                    self.profile.get("nama_peternak"), self.profile.get("nama_lemari"))
        return self.get_profile()

    def sync_from_cloud(self, cloud_tetasco_data: dict):
        """
        Menyinkronkan data akun dari Cloud Server tetasco.my.id
        Format data cloud:
        {
          "id": 1,
          "name": "Tetasco 01",
          "status": "active",
          "user": { "id": 1, "name": "Admin Tetasco", "email": "admin@tetasco.local" }
        }
        """
        if not cloud_tetasco_data or not isinstance(cloud_tetasco_data, dict):
            return

        changed = False
        user_info = cloud_tetasco_data.get("user")
        if user_info and isinstance(user_info, dict):
            u_name = user_info.get("name")
            u_email = user_info.get("email")
            if u_name and u_name != self.profile.get("nama_peternak"):
                self.profile["nama_peternak"] = u_name
                changed = True
            if u_email and u_email != self.profile.get("email"):
                self.profile["email"] = u_email
                changed = True

        dev_name = cloud_tetasco_data.get("name")
        if dev_name and dev_name != self.profile.get("nama_lemari"):
            self.profile["nama_lemari"] = dev_name
            changed = True

        status = cloud_tetasco_data.get("status")
        if status:
            self.profile["status_lemari"] = status

        if "id" in cloud_tetasco_data:
            self.profile["tetasco_id"] = cloud_tetasco_data["id"]

        if changed:
            self._save_profile()
            logger.info("☁️ Profil Peternak berhasil disinkronkan dari Cloud: %s", self.profile["nama_peternak"])

profile_manager = ProfileManager()
