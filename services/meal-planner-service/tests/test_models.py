"""
Tests for database models.
"""
import pytest
from models import Meal, MealPlan, MealType, DayOfWeek
from datetime import date
import uuid


class TestMealPlanModel:
    """Tests for MealPlan model."""

    def test_create_meal_plan(self, db_session):
        """Test creating a meal plan."""
        user_id = uuid.uuid4()
        
        meal_plan = MealPlan(
            id=uuid.uuid4(),
            user_id=user_id,
            week_start=date(2025, 11, 24)
        )
        
        db_session.add(meal_plan)
        db_session.commit()
        
        assert meal_plan.id is not None
        assert meal_plan.user_id == user_id
        assert meal_plan.week_start == date(2025, 11, 24)
        assert meal_plan.generated_at is not None

    def test_meal_plan_repr(self, db_session):
        """Test meal plan string representation."""
        user_id = uuid.uuid4()
        meal_plan = MealPlan(
            id=uuid.uuid4(),
            user_id=user_id,
            week_start=date(2025, 11, 24)
        )
        
        repr_str = repr(meal_plan)
        assert "MealPlan" in repr_str
        assert str(user_id) in repr_str


class TestMealModel:
    """Tests for Meal model."""

    def test_create_meal(self, db_session):
        """Test creating a meal."""
        user_id = uuid.uuid4()
        
        # Create meal plan first
        meal_plan = MealPlan(
            id=uuid.uuid4(),
            user_id=user_id,
            week_start=date(2025, 11, 24)
        )
        db_session.add(meal_plan)
        db_session.flush()
        
        # Create meal
        meal = Meal(
            id=uuid.uuid4(),
            meal_plan_id=meal_plan.id,
            user_id=user_id,
            day=DayOfWeek.MONDAY,
            meal_type=MealType.BREAKFAST,
            name="Test Breakfast",
            calories=400,
            protein=25.0,
            carbs=45.0,
            fats=12.0,
            ingredients=["ingredient 1", "ingredient 2"]
        )
        
        db_session.add(meal)
        db_session.commit()
        
        assert meal.id is not None
        assert meal.name == "Test Breakfast"
        assert meal.calories == 400
        assert len(meal.ingredients) == 2

    def test_meal_plan_relationship(self, db_session):
        """Test relationship between MealPlan and Meal."""
        user_id = uuid.uuid4()
        
        meal_plan = MealPlan(
            id=uuid.uuid4(),
            user_id=user_id,
            week_start=date(2025, 11, 24)
        )
        db_session.add(meal_plan)
        db_session.flush()
        
        meal = Meal(
            id=uuid.uuid4(),
            meal_plan_id=meal_plan.id,
            user_id=user_id,
            day=DayOfWeek.MONDAY,
            meal_type=MealType.LUNCH,
            name="Test Lunch",
            calories=500,
            protein=30.0,
            carbs=55.0,
            fats=15.0,
            ingredients=["ingredient 1"]
        )
        db_session.add(meal)
        db_session.commit()
        
        # Test accessing meal plan from meal
        assert meal.meal_plan is not None
        assert meal.meal_plan.id == meal_plan.id
        
        # Test accessing meals from meal plan
        db_session.refresh(meal_plan)
        assert len(meal_plan.meals) == 1
        assert meal_plan.meals[0].name == "Test Lunch"

    def test_meal_cascade_delete(self, db_session):
        """Test that meals are deleted when meal plan is deleted."""
        user_id = uuid.uuid4()
        
        meal_plan = MealPlan(
            id=uuid.uuid4(),
            user_id=user_id,
            week_start=date(2025, 11, 24)
        )
        db_session.add(meal_plan)
        db_session.flush()
        
        meal = Meal(
            id=uuid.uuid4(),
            meal_plan_id=meal_plan.id,
            user_id=user_id,
            day=DayOfWeek.TUESDAY,
            meal_type=MealType.DINNER,
            name="Test Dinner",
            calories=600,
            protein=40.0,
            carbs=60.0,
            fats=20.0,
            ingredients=["ingredient 1"]
        )
        db_session.add(meal)
        db_session.commit()
        
        meal_id = meal.id
        
        # Delete meal plan
        db_session.delete(meal_plan)
        db_session.commit()
        
        # Meal should also be deleted
        deleted_meal = db_session.query(Meal).filter(Meal.id == meal_id).first()
        assert deleted_meal is None

    def test_meal_enums(self):
        """Test enum values."""
        assert MealType.BREAKFAST.value == "breakfast"
        assert MealType.LUNCH.value == "lunch"
        assert MealType.DINNER.value == "dinner"
        
        assert DayOfWeek.MONDAY.value == "monday"
        assert DayOfWeek.SUNDAY.value == "sunday"

