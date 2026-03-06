-- Add is_approved column to properties table for admin approval workflow
-- Properties published by agents will start with is_approved = false until admin approves

-- Add the is_approved column if it doesn't exist
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

-- Add a column to track who created/published the property (for audit)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS published_by_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL;

-- Create index for faster approval workflow queries
CREATE INDEX IF NOT EXISTS idx_properties_is_approved ON public.properties(is_approved);
CREATE INDEX IF NOT EXISTS idx_properties_published_by_agent ON public.properties(published_by_agent_id);

-- Add composite index for finding unapproved agent properties
CREATE INDEX IF NOT EXISTS idx_properties_approval_status ON public.properties(is_approved, published_by_agent_id);

-- Comment for documentation
COMMENT ON COLUMN public.properties.is_approved IS 'Whether the property has been approved by admin. Properties published by agents start as false.';
COMMENT ON COLUMN public.properties.published_by_agent_id IS 'The agent ID if this property was published by an agent. NULL if published by admin.';

-- Verify the migration
SELECT 
    COUNT(*) as total_properties,
    COUNT(CASE WHEN is_approved = true THEN 1 END) as approved_properties,
    COUNT(CASE WHEN is_approved = false THEN 1 END) as pending_approval,
    COUNT(CASE WHEN published_by_agent_id IS NOT NULL THEN 1 END) as agent_published
FROM public.properties;
