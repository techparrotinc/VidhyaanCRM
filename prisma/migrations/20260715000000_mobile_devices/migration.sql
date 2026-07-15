-- Mobile app device sessions: rotating refresh-token hash + Expo push token.
CREATE TABLE "platform"."mobile_devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "device_name" TEXT,
    "push_token" TEXT,
    "assignment_id" TEXT,
    "refresh_token_hash" TEXT,
    "prev_refresh_token_hash" TEXT,
    "refresh_expires_at" TIMESTAMP(3),
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_devices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mobile_devices_user_id_device_id_key" ON "platform"."mobile_devices"("user_id", "device_id");

CREATE INDEX "mobile_devices_device_id_idx" ON "platform"."mobile_devices"("device_id");

ALTER TABLE "platform"."mobile_devices" ADD CONSTRAINT "mobile_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "platform"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
