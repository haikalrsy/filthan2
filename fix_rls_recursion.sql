-- ============================================
-- FIX: Infinite recursion in profiles RLS policy
-- ============================================
-- Problem: "Admins can manage all profiles." uses FOR ALL which includes SELECT.
-- When is_admin() does SELECT on profiles, it triggers the same FOR ALL policy,
-- calling is_admin() again → infinite recursion.
--
-- Fix: Replace FOR ALL with specific INSERT/UPDATE/DELETE policies.
-- This way, is_admin()'s internal SELECT only triggers the safe "SELECT USING(true)" policy.

-- Step 1: Drop the problematic FOR ALL policy on profiles
DROP POLICY IF EXISTS "Admins can manage all profiles." ON profiles;

-- Step 2: Create separate policies for each write operation (NOT SELECT)
CREATE POLICY "Admins can insert any profile." ON profiles FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update any profile." ON profiles FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete any profile." ON profiles FOR DELETE USING (is_admin());

-- Done! The existing "Public profiles are viewable by everyone." SELECT policy handles reads.
-- is_admin() can now safely query profiles without triggering recursion.
