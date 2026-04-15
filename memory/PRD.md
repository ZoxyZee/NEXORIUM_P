# Nexorium – Digital Ownership Protection System

## Problem Statement
Build a professional SaaS web application for digital ownership protection with file upload, SHA-256 hashing, NFT ID generation, dashboard, ownership verification, and hybrid blockchain (MetaMask + simulated minting).

## Architecture
- **Frontend**: React + Tailwind CSS + Framer Motion + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor)
- **Blockchain**: Hybrid (MetaMask wallet connect via ethers.js + simulated NFT minting)

## User Personas
- Digital creators wanting to protect IP
- Developers demonstrating blockchain-adjacent tech
- Presenters needing a polished demo product

## Core Requirements
- File upload with SHA-256 hash generation
- NFT ID generation (NFT-XXXXX format)
- Asset dashboard with search (by name, NFT ID, hash)
- Ownership verification by hash or NFT ID
- Profile system with sliding drawer
- MetaMask wallet connection (demo fallback)
- Dark theme with indigo/purple accents

## What's Been Implemented (Feb 2026)
- Full backend API: upload, mint, verify, profile, stats, search
- **JWT Authentication with pre-seeded demo users (user1@nexorium.com, user2@nexorium.com)**
- **Login & Register pages with protected route system**
- **User isolation: each user sees only their own assets**
- **Cross-user ownership verification**
- Dashboard with bento grid stats, data table, search bar, empty state
- Upload page with drag-drop, progress steps, success result
- Verify page with hash/NFT ID search and verification result
- Glassmorphism navbar with navigation, wallet connect, and logout
- Profile drawer (Shadcn Sheet) with avatar, wallet, stats
- Framer Motion animations throughout
- Custom Outfit/Manrope/Azeret Mono typography
- Toast notifications via Sonner

## Backlog
### P0 (Critical)
- None remaining

### P1 (Important)
- Real blockchain integration (Polygon Mumbai smart contract deployment)
- IPFS file storage integration
- File preview in dashboard (images, PDFs)

### P2 (Nice to Have)
- Multi-user authentication system
- Royalty system for secondary sales
- Asset transfer functionality
- Export/share verification certificates
- Activity history timeline per asset

## Next Tasks
1. Deploy Solidity smart contract on Polygon Mumbai testnet
2. Add IPFS integration for decentralized file storage
3. Add user authentication (JWT or Google OAuth)
4. Add batch upload functionality
5. Add asset detail view with full metadata
