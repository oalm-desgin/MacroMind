"""
Tests for database models.
"""
import pytest
from models import User, UserProfile, FitnessGoal, DietaryPreference
from auth import hash_password
import uuid


class TestUserModel:
    """Tests for User model."""

    def test_create_user(self, db_session):
        """Test creating a user."""
        user = User(
            id=uuid.uuid4(),
            email="test@example.com",
            password_hash=hash_password("TestPass123!")
        )
        
        db_session.add(user)
        db_session.commit()
        
        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.password_hash is not None
        assert user.created_at is not None
        assert user.updated_at is not None

    def test_user_email_unique(self, db_session):
        """Test that email must be unique."""
        user1 = User(
            id=uuid.uuid4(),
            email="test@example.com",
            password_hash=hash_password("TestPass123!")
        )
        db_session.add(user1)
        db_session.commit()
        
        # Try to create another user with same email
        user2 = User(
            id=uuid.uuid4(),
            email="test@example.com",
            password_hash=hash_password("TestPass456!")
        )
        db_session.add(user2)
        
        with pytest.raises(Exception):  # Database will raise integrity error
            db_session.commit()

    def test_user_repr(self, db_session):
        """Test user string representation."""
        user = User(
            id=uuid.uuid4(),
            email="test@example.com",
            password_hash=hash_password("TestPass123!")
        )
        
        repr_str = repr(user)
        assert "User" in repr_str
        assert "test@example.com" in repr_str


class TestUserProfileModel:
    """Tests for UserProfile model."""

    def test_create_profile(self, db_session):
        """Test creating a user profile."""
        user = User(
            id=uuid.uuid4(),
            email="test@example.com",
            password_hash=hash_password("TestPass123!")
        )
        db_session.add(user)
        db_session.flush()
        
        profile = UserProfile(
            id=uuid.uuid4(),
            user_id=user.id,
            fitness_goal=FitnessGoal.CUT,
            dietary_preference=DietaryPreference.NONE,
            daily_calories=2000
        )
        
        db_session.add(profile)
        db_session.commit()
        
        assert profile.id is not None
        assert profile.user_id == user.id
        assert profile.fitness_goal == FitnessGoal.CUT
        assert profile.dietary_preference == DietaryPreference.NONE
        assert profile.daily_calories == 2000

    def test_profile_user_relationship(self, db_session):
        """Test relationship between User and UserProfile."""
        user = User(
            id=uuid.uuid4(),
            email="test@example.com",
            password_hash=hash_password("TestPass123!")
        )
        db_session.add(user)
        db_session.flush()
        
        profile = UserProfile(
            id=uuid.uuid4(),
            user_id=user.id,
            fitness_goal=FitnessGoal.BULK,
            dietary_preference=DietaryPreference.VEGAN,
            daily_calories=2500
        )
        db_session.add(profile)
        db_session.commit()
        
        # Test accessing profile from user
        db_session.refresh(user)
        assert user.profile is not None
        assert user.profile.fitness_goal == FitnessGoal.BULK
        
        # Test accessing user from profile
        assert profile.user is not None
        assert profile.user.email == "test@example.com"

    def test_profile_cascade_delete(self, db_session):
        """Test that profile is deleted when user is deleted."""
        user = User(
            id=uuid.uuid4(),
            email="test@example.com",
            password_hash=hash_password("TestPass123!")
        )
        db_session.add(user)
        db_session.flush()
        
        profile = UserProfile(
            id=uuid.uuid4(),
            user_id=user.id,
            fitness_goal=FitnessGoal.MAINTAIN,
            dietary_preference=DietaryPreference.HALAL
        )
        db_session.add(profile)
        db_session.commit()
        
        profile_id = profile.id
        
        # Delete user
        db_session.delete(user)
        db_session.commit()
        
        # Profile should also be deleted
        deleted_profile = db_session.query(UserProfile).filter(
            UserProfile.id == profile_id
        ).first()
        assert deleted_profile is None

    def test_fitness_goal_enum(self):
        """Test FitnessGoal enum values."""
        assert FitnessGoal.CUT.value == "cut"
        assert FitnessGoal.BULK.value == "bulk"
        assert FitnessGoal.MAINTAIN.value == "maintain"

    def test_dietary_preference_enum(self):
        """Test DietaryPreference enum values."""
        assert DietaryPreference.NONE.value == "none"
        assert DietaryPreference.HALAL.value == "halal"
        assert DietaryPreference.VEGAN.value == "vegan"
        assert DietaryPreference.VEGETARIAN.value == "vegetarian"

