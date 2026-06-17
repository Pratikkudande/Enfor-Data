package service

import (
	"fmt"

	"enfor-data-backend/internal/models"
	"enfor-data-backend/internal/repository"
)

type NotificationService struct {
	repo        *repository.NotificationRepository
	networkRepo *repository.NetworkRepository
	userRepo    *repository.UserRepository
}

func NewNotificationService(
	repo *repository.NotificationRepository,
	networkRepo *repository.NetworkRepository,
	userRepo *repository.UserRepository,
) *NotificationService {
	return &NotificationService{repo: repo, networkRepo: networkRepo, userRepo: userRepo}
}

func (s *NotificationService) List(userID string, limit, offset int) ([]models.Notification, error) {
	return s.repo.ListByUser(userID, limit, offset)
}

func (s *NotificationService) Count(userID string) (int, error)       { return s.repo.CountByUser(userID) }
func (s *NotificationService) Unread(userID string) (int, error)      { return s.repo.CountUnread(userID) }
func (s *NotificationService) ByType(userID string) (map[string]int, error) {
	return s.repo.CountByType(userID)
}
func (s *NotificationService) MarkRead(userID, id string) error  { return s.repo.MarkRead(userID, id) }
func (s *NotificationService) MarkAllRead(userID string) error   { return s.repo.MarkAllRead(userID) }
func (s *NotificationService) Delete(userID, id string) error    { return s.repo.Delete(userID, id) }

// actorName builds a display name for the user who triggered an event.
func (s *NotificationService) actorName(userID string) string {
	u, err := s.userRepo.GetUserByID(userID)
	if err != nil || u == nil {
		return "A connection"
	}
	name := u.FirstName + " " + u.LastName
	if u.FirmName != "" {
		name += " (" + u.FirmName + ")"
	}
	return name
}

// connectedUserIDs returns the IDs of users connected to the given user.
func (s *NotificationService) connectedUserIDs(userID string) []string {
	conns, err := s.networkRepo.GetConnections(userID)
	if err != nil {
		return nil
	}
	ids := make([]string, 0, len(conns))
	for _, c := range conns {
		ids = append(ids, c.PeerID)
	}
	return ids
}

// followerIDs returns the IDs of brokers who follow the given channel partner.
func (s *NotificationService) followerIDs(partnerID string) []string {
	followers, err := s.networkRepo.GetFollowersForPartner(partnerID)
	if err != nil {
		return nil
	}
	ids := make([]string, 0, len(followers))
	for _, f := range followers {
		if id, ok := f["id"].(string); ok {
			ids = append(ids, id)
		}
	}
	return ids
}

// notifyUsers creates a notification for each user that has the preference enabled.
func (s *NotificationService) notifyUsers(userIDs []string, prefKey, nType, title, message, actionURL string, metadata models.JSONB) {
	for _, uid := range userIDs {
		if !s.repo.WantsNotification(uid, prefKey) {
			continue
		}
		var url *string
		if actionURL != "" {
			u := actionURL
			url = &u
		}
		_ = s.repo.Create(&models.Notification{
			UserID:    uid,
			Type:      nType,
			Title:     title,
			Message:   message,
			ActionURL: url,
			Metadata:  metadata,
		})
	}
}

// NotifyPropertyAdded notifies the actor's broker-network connections that a
// property was added.
func (s *NotificationService) NotifyPropertyAdded(actorID, propertyID, propertyTitle string) {
	name := s.actorName(actorID)
	s.notifyUsers(
		s.connectedUserIDs(actorID),
		"propertyUpdates", models.NotificationTypeProperty,
		"New property in your network",
		fmt.Sprintf("%s added a new property: %s", name, propertyTitle),
		"/properties/view/"+propertyID,
		models.JSONB{"property_id": propertyID, "actor_id": actorID},
	)
}

// NotifyProjectAdded notifies the brokers who follow this channel partner that a
// project was added.
func (s *NotificationService) NotifyProjectAdded(actorID, projectID, projectName string) {
	name := s.actorName(actorID)
	s.notifyUsers(
		s.followerIDs(actorID),
		"projectUpdates", models.NotificationTypeProject,
		"New project from a channel partner you follow",
		fmt.Sprintf("%s launched a new project: %s", name, projectName),
		"/projects",
		models.JSONB{"project_id": projectID, "actor_id": actorID},
	)
}
