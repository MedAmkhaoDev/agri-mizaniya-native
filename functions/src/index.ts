import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()
const db = admin.firestore()
const messaging = admin.messaging()

// ─── Helpers ─────────────────────────────────────────────

async function getFarmName(farmId: string): Promise<string> {
  const snap = await db.doc(`farms/${farmId}`).get()
  return snap.exists ? snap.data()!.name : 'Unknown Farm'
}

async function getUserName(userId: string): Promise<string> {
  const snap = await db.doc(`users/${userId}`).get()
  return snap.exists ? snap.data()!.fullName || 'Unknown' : 'Unknown'
}

async function getMemberTokens(farmId: string, excludeUserId: string): Promise<string[]> {
  const membersSnap = await db.collection(`farms/${farmId}/members`).get()
  const tokens: string[] = []

  for (const memberDoc of membersSnap.docs) {
    if (memberDoc.id === excludeUserId) continue

    const tokensSnap = await db.collection(`users/${memberDoc.id}/fcmTokens`)
      .where('active', '!=', false)
      .get()

    for (const tokenDoc of tokensSnap.docs) {
      const data = tokenDoc.data()
      if (data.token) tokens.push(data.token)
    }
  }

  return [...new Set(tokens)]
}

async function getUserTokens(userId: string): Promise<string[]> {
  const tokensSnap = await db.collection(`users/${userId}/fcmTokens`)
    .where('active', '!=', false)
    .get()

  return tokensSnap.docs.map((d) => d.data().token).filter(Boolean)
}

function sendPush(tokens: string[], notification: { title: string; body: string }, data: Record<string, string>) {
  if (tokens.length === 0) return

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification,
    data,
    android: {
      priority: 'high' as const,
      notification: {
        channelId: 'default',
        color: '#16A34A',
      },
    },
    apns: {
      payload: {
        aps: {
          badge: 1,
          sound: 'default',
        },
      },
    },
  }

  messaging.sendEachForMulticast(message).then((response) => {
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          functions.logger.warn(`Push failed for token ${tokens[idx]}: ${resp.error?.message}`)
        }
      })
    }
  }).catch((err) => {
    functions.logger.error('Push send error:', err)
  })
}

// ─── Invitation Created ──────────────────────────────────

export const onInvitationCreated = functions.firestore
  .document('farms/{farmId}/invitations/{invitationId}')
  .onCreate(async (snap, context) => {
    const { farmId } = context.params
    const invitation = snap.data()

    const farmName = await getFarmName(farmId)
    const inviterName = await getUserName(invitation.invitedBy)

    const tokens = await getUserTokens(invitation.invitedBy)

    sendPush(tokens, {
      title: 'Invitation envoyée',
      body: `${inviterName} a invité ${invitation.email} à rejoindre ${farmName}`,
    }, {
      type: 'INVITE_SENT',
      farmId,
      screen: 'farm-select',
    })
  })

// ─── Invitation Accepted ─────────────────────────────────

export const onInvitationAccepted = functions.firestore
  .document('farms/{farmId}/invitations/{invitationId}')
  .onUpdate(async (change, context) => {
    const { farmId } = context.params
    const before = change.before.data()
    const after = change.after.data()

    if (before.status === 'pending' && after.status === 'accepted') {
      const farmName = await getFarmName(farmId)

      const membersSnap = await db.collection(`farms/${farmId}/members`).get()
      const tokens: string[] = []

      for (const memberDoc of membersSnap.docs) {
        const tokensSnap = await db.collection(`users/${memberDoc.id}/fcmTokens`)
          .where('active', '!=', false)
          .get()
        for (const tokenDoc of tokensSnap.docs) {
          tokens.push(tokenDoc.data().token)
        }
      }

      sendPush([...new Set(tokens)], {
        title: 'Invitation acceptée',
        body: `${after.email} a accepté l'invitation à rejoindre ${farmName}`,
      }, {
        type: 'INVITE_ACCEPTED',
        farmId,
        screen: 'farm-select',
      })
    }
  })

// ─── Member Joined / Left / Role Changed ─────────────────

export const onMemberChanged = functions.firestore
  .document('farms/{farmId}/members/{userId}')
  .onWrite(async (change, context) => {
    const { farmId, userId } = context.params
    const farmName = await getFarmName(farmId)
    const userName = await getUserName(userId)

    if (!change.before.exists && change.after.exists) {
      // Member joined
      const tokens = await getMemberTokens(farmId, userId)
      sendPush(tokens, {
        title: 'Membre rejoint',
        body: `${userName} a rejoint ${farmName}`,
      }, {
        type: 'MEMBER_JOINED',
        farmId,
        userId,
        screen: 'tools/members',
      })
    } else if (change.before.exists && !change.after.exists) {
      // Member left / removed
      const tokens = await getUserTokens(userId)
      sendPush(tokens, {
        title: 'Membre retiré',
        body: `Vous avez été retiré de ${farmName}`,
      }, {
        type: 'MEMBER_LEFT',
        farmId,
        screen: 'farm-select',
      })
    } else if (change.before.exists && change.after.exists) {
      // Role changed
      const oldRole = change.before.data()!.role
      const newRole = change.after.data()!.role

      if (oldRole !== newRole) {
        const roleLabels: Record<string, string> = {
          owner: 'Propriétaire',
          manager: 'Gestionnaire',
          worker: 'Travailleur',
          viewer: 'Observateur',
        }

        const tokens = await getUserTokens(userId)
        sendPush(tokens, {
          title: 'Rôle modifié',
          body: `Votre rôle dans ${farmName} a été changé en ${roleLabels[newRole] || newRole}`,
        }, {
          type: 'ROLE_CHANGED',
          farmId,
          userId,
          screen: 'tools/members',
        })
      }
    }
  })

// ─── Expense Created ─────────────────────────────────────

export const onExpenseCreated = functions.firestore
  .document('farms/{farmId}/expenses/{expenseId}')
  .onCreate(async (snap, context) => {
    const { farmId } = context.params
    const expense = snap.data()
    const farmName = await getFarmName(farmId)
    const userName = await getUserName(expense.createdBy)

    const tokens = await getMemberTokens(farmId, expense.createdBy)
    const amount = expense.amount?.toLocaleString('fr-FR') || '0'

    sendPush(tokens, {
      title: 'Dépense enregistrée',
      body: `${userName} a enregistré une dépense de ${amount} MAD dans ${farmName}`,
    }, {
      type: 'EXPENSE_CREATED',
      farmId,
      expenseId: context.params.expenseId,
      screen: 'expenses',
    })
  })

// ─── Income Created ──────────────────────────────────────

export const onIncomeCreated = functions.firestore
  .document('farms/{farmId}/incomes/{incomeId}')
  .onCreate(async (snap, context) => {
    const { farmId } = context.params
    const income = snap.data()
    const farmName = await getFarmName(farmId)
    const userName = await getUserName(income.createdBy)

    const tokens = await getMemberTokens(farmId, income.createdBy)
    const amount = income.totalAmount?.toLocaleString('fr-FR') || '0'

    sendPush(tokens, {
      title: 'Revenu enregistré',
      body: `${userName} a enregistré un revenu de ${amount} MAD dans ${farmName}`,
    }, {
      type: 'INCOME_CREATED',
      farmId,
      incomeId: context.params.incomeId,
      screen: 'incomes',
    })
  })

// ─── Gas Usage Created ───────────────────────────────────

export const onGasUsageCreated = functions.firestore
  .document('farms/{farmId}/gasUsages/{gasUsageId}')
  .onCreate(async (snap, context) => {
    const { farmId } = context.params
    const gas = snap.data()
    const farmName = await getFarmName(farmId)
    const userName = await getUserName(gas.createdBy)

    const tokens = await getMemberTokens(farmId, gas.createdBy)
    const amount = gas.totalAmount?.toLocaleString('fr-FR') || '0'

    sendPush(tokens, {
      title: 'Gaz enregistré',
      body: `${userName} a enregistré une consommation de gaz de ${amount} MAD dans ${farmName}`,
    }, {
      type: 'GAS_CREATED',
      farmId,
      gasUsageId: context.params.gasUsageId,
      screen: 'tools/gas',
    })
  })

// ─── Cooperative Support Created ─────────────────────────

export const onCooperativeCreated = functions.firestore
  .document('farms/{farmId}/cooperativeSupports/{supportId}')
  .onCreate(async (snap, context) => {
    const { farmId } = context.params
    const support = snap.data()
    const farmName = await getFarmName(farmId)
    const userName = await getUserName(support.createdBy)

    const tokens = await getMemberTokens(farmId, support.createdBy)
    const amount = support.amount?.toLocaleString('fr-FR') || '0'

    sendPush(tokens, {
      title: 'Coopérative enregistrée',
      body: `${userName} a enregistré une aide coopérative de ${amount} MAD dans ${farmName}`,
    }, {
      type: 'COOPERATIVE_CREATED',
      farmId,
      supportId: context.params.supportId,
      screen: 'tools/cooperative',
    })
  })

// ─── Farm Settings Changed ───────────────────────────────

export const onFarmUpdated = functions.firestore
  .document('farms/{farmId}')
  .onUpdate(async (change, context) => {
    const { farmId } = context.params
    const before = change.before.data()
    const after = change.after.data()

    const changedFields = Object.keys(after).filter(
      (key) => key !== 'updatedAt' && before[key] !== after[key]
    )

    if (changedFields.length === 0) return

    const farmName = after.name || 'Unknown Farm'

    const membersSnap = await db.collection(`farms/${farmId}/members`).get()
    const tokens: string[] = []

    for (const memberDoc of membersSnap.docs) {
      const tokensSnap = await db.collection(`users/${memberDoc.id}/fcmTokens`)
        .where('active', '!=', false)
        .get()
      for (const tokenDoc of tokensSnap.docs) {
        tokens.push(tokenDoc.data().token)
      }
    }

    sendPush([...new Set(tokens)], {
      title: 'Paramètres modifiés',
      body: `Les paramètres de ${farmName} ont été mis à jour`,
    }, {
      type: 'FARM_SETTINGS_CHANGED',
      farmId,
      screen: 'tools/farm-settings',
    })
  })
