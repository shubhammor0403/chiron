from django.apps import AppConfig
from .db import Base, engine
from sqlalchemy.engine.reflection import Inspector

class CalorieTrackerConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "calorie_tracker"
    def ready(self):
        inspector = Inspector.from_engine(engine)
        if 'chiron_calories' not in inspector.get_table_names():
            from .db import Base
            Base.metadata.create_all(engine)

        if 'chiron_food_db' not in inspector.get_table_names():
            from .db import Base
            Base.metadata.create_all(engine)
