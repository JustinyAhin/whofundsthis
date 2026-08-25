# Project brief

## One sentence

Who Funds This? shows researchers which organizations have previously funded work like theirs and the evidence behind each match.

## Problem

Historical research funding is fragmented across funder and country databases. Existing tools are often agency-specific, expensive, or focused on open opportunities rather than answering:

> Who has actually funded similar research, where, for how much, and what came from it?

## Product

A researcher enters a short, non-confidential description and optionally selects a country. The product returns:

- Relevant funders, ranked with an explainable score.
- Similar awards that justify each recommendation.
- Countries, institutions, investigators, schemes, and award ranges.
- Publications linked to the strongest awards.
- Visible provenance and coverage limitations.

OpenAlex provides the underlying awards graph; the product adds a guided workflow and country-aware interpretation. See the [OpenAlex Awards documentation](https://help.openalex.org/data/awards/).

## First users and business hypothesis

Start with active researchers, grant professionals, and research-support staff at small or under-resourced institutions. Individual search remains free. Paid value may come later from exports, reports, monitoring, shared workspaces, and institutional access.

Do not assume researchers want another monthly subscription. Validate the workflow first through repeated searches, exports, and real proposal discussions.

## Non-goals

- Listing every currently open funding opportunity.
- Claiming that a researcher is eligible for an award.
- Writing or submitting grant proposals.
- Ranking researchers or funders by prestige.
- Rebuilding or locally indexing all of OpenAlex.
- Treating missing data as proof that no funding exists.

## Current decision

Build this first as a useful public tool and OpenAlex portfolio project. Treat a standalone SaaS business as a hypothesis until professional or institutional users demonstrate repeat demand.
