-- Update referral_links table to track admin approval
ALTER TABLE referral_links 
ADD COLUMN admin_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN admin_approved_at TIMESTAMP,
ADD COLUMN admin_notes TEXT;

-- Update referral_tracking table for approval workflow
ALTER TABLE referral_tracking
ADD COLUMN admin_approval_status VARCHAR(20) DEFAULT 'pending' CHECK (admin_approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN admin_approved_at TIMESTAMP,
ADD COLUMN admin_rejection_reason TEXT,
ADD COLUMN referred_user_registered BOOLEAN DEFAULT FALSE,
ADD COLUMN referred_user_registered_at TIMESTAMP;

-- Create invitation_audit_log to track all admin actions
CREATE TABLE IF NOT EXISTS invitation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  referral_id UUID NOT NULL REFERENCES referral_tracking(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('approved', 'rejected', 'noted', 'viewed')),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX idx_referral_tracking_approval_status ON referral_tracking(admin_approval_status, created_at DESC);
CREATE INDEX idx_referral_links_approved ON referral_links(admin_approved, created_at DESC);
CREATE INDEX idx_invitation_audit_log_admin ON invitation_audit_log(admin_id, created_at DESC);

-- Enable RLS for audit log
ALTER TABLE invitation_audit_log ENABLE ROW LEVEL SECURITY;
