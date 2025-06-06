import EnterpriseFeatureButton from '@components/Billing/EnterpriseFeatureButton'
import { Button } from '@components/Button'
import {
	useGetWorkspaceAdminsQuery,
	useGetWorkspaceSettingsQuery,
} from '@graph/hooks'
import { AdminRole, Project, WorkspaceAdminRole } from '@graph/schemas'
import {
	Box,
	IconSolidUserAdd,
	Stack,
	Tabs,
	Tooltip,
	Text,
	Callout,
} from '@highlight-run/ui/components'
import { useAuthContext } from '@/authentication/AuthContext'
import AllMembers from '@pages/WorkspaceTeam/components/AllMembers'
import { AutoJoinForm } from '@pages/WorkspaceTeam/components/AutoJoinForm'
import InviteMemberModal from '@pages/WorkspaceTeam/components/InviteMemberModal'
import { PendingInvites } from '@pages/WorkspaceTeam/components/PendingInvites'
import { Authorization } from '@util/authorization/authorization'
import { useParams } from '@util/react-router/useParams'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useToggle } from 'react-use'

import { useApplicationContext } from '@/routers/AppRouter/context/ApplicationContext'

import layoutStyles from '../../components/layout/LeadAlignLayout.module.css'
import styles from './WorkspaceTeam.module.css'

enum MemberKeyType {
	Members = 'members',
	Invites = 'invites',
}

const WorkspaceTeam = () => {
	const { workspace_id, member_tab_key = MemberKeyType.Members } = useParams<{
		workspace_id: string
		member_tab_key?: MemberKeyType
	}>()
	const { data: workspaceSettings, loading: workspaceSettingsLoading } =
		useGetWorkspaceSettingsQuery({
			variables: {
				workspace_id: workspace_id!,
			},
			skip: !workspace_id,
		})
	const {
		data,
		error,
		loading: adminsLoading,
	} = useGetWorkspaceAdminsQuery({
		variables: { workspace_id: workspace_id! },
		skip: !workspace_id,
	})
	const { allProjects, loading: appLoading } = useApplicationContext()
	const navigate = useNavigate()
	const [showModal, toggleShowModal] = useToggle(false)

	if (error) {
		return <div>{JSON.stringify(error)}</div>
	}

	return (
		<Box>
			<Box style={{ maxWidth: 1080 }} my="40" mx="auto">
				<div className={styles.titleContainer}>
					<h3>Members</h3>
					<p className={layoutStyles.subTitle}>
						Invite new users to your workspace or manage their
						roles!
					</p>
					<Authorization allowedRoles={[AdminRole.Admin]}>
						<AutoJoinForm />
					</Authorization>
					<InviteMemberModal
						workspaceId={workspace_id}
						workspaceName={data?.workspace?.name}
						workspaceInviteLinks={data?.workspace_invite_links}
						showModal={showModal}
						toggleShowModal={toggleShowModal}
					/>
				</div>

				{!workspaceSettingsLoading &&
					!workspaceSettings?.workspaceSettings?.enable_sso && (
						<Callout
							title="Single Sign-On (SSO)"
							style={{ maxWidth: 600, marginBottom: 12 }}
						>
							<Text color="moderate">
								Enable SSO to streamline authentication for your
								organization. Integrate with your identity
								provider to simplify user access and enhance
								security.
							</Text>
							<EnterpriseFeatureButton
								setting="enable_sso"
								name="Single Sign-On (SSO)"
								fn={() => {
									const href =
										`mailto:support@highlight.run?subject=Highlight SSO Configuration` +
										`&body=I would like to configure SSO for my workspace.  My workspace ID is ${workspace_id}.`
									window.open(href, '_blank')
								}}
								variant="basic"
							>
								<Box display="flex" style={{ width: 104 }}>
									<Button
										kind="secondary"
										size="xSmall"
										trackingId="WorkspaceTeamConfigureSSO"
									>
										<Text>Configure SSO</Text>
									</Button>
								</Box>
							</EnterpriseFeatureButton>
						</Callout>
					)}

				<Tabs<MemberKeyType>
					selectedId={member_tab_key}
					onChange={(id) => {
						navigate(`/w/${workspace_id}/team/${id}`)
					}}
				>
					<Tabs.List>
						<Tabs.Tab id={MemberKeyType.Members}>Members</Tabs.Tab>
						<Tabs.Tab id={MemberKeyType.Invites}>
							Pending invites
						</Tabs.Tab>
					</Tabs.List>
					<Tabs.Panel id={MemberKeyType.Members}>
						<TabContentContainer
							title="All members"
							toggleInviteModal={toggleShowModal}
						>
							<AllMembers
								workspaceId={workspace_id}
								admins={data?.admins as WorkspaceAdminRole[]}
								projects={allProjects as Project[]}
								loading={adminsLoading || appLoading}
							/>
						</TabContentContainer>
					</Tabs.Panel>
					<Tabs.Panel id={MemberKeyType.Invites}>
						<TabContentContainer
							title="Pending invites"
							toggleInviteModal={toggleShowModal}
						>
							<PendingInvites
								workspaceId={workspace_id}
								active={
									member_tab_key === MemberKeyType.Invites
								}
								shouldRefetchData={!showModal}
							/>
						</TabContentContainer>
					</Tabs.Panel>
				</Tabs>
			</Box>
		</Box>
	)
}

const TabContentContainer = ({
	children,
	title,
	toggleInviteModal,
}: {
	children: any
	title: string
	toggleInviteModal: React.Dispatch<React.SetStateAction<boolean>>
}) => {
	const { workspaceRole } = useAuthContext()

	const isAdminUser = workspaceRole === AdminRole.Admin

	return (
		<Box mt="8">
			<Stack
				mb="8"
				align="center"
				justify="space-between"
				direction="row"
			>
				<h4 className={styles.tabTitle}>{title}</h4>
				<Tooltip
					disabled={isAdminUser}
					trigger={
						<EnterpriseFeatureButton
							setting="enable_business_seats"
							name="More than 15 team members"
							fn={() => toggleInviteModal((shown) => !shown)}
							disabled={!isAdminUser}
							variant="basic"
						>
							<Button
								trackingId="WorkspaceTeamInviteMember"
								iconLeft={<IconSolidUserAdd />}
								onClick={() => null}
								disabled={!isAdminUser}
							>
								Invite users
							</Button>
						</EnterpriseFeatureButton>
					}
				>
					Please contact an admin to invite users
				</Tooltip>
			</Stack>
			{children}
		</Box>
	)
}

export default WorkspaceTeam
