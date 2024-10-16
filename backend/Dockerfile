# Use the official Python image as a base
FROM python:3.9

# Install SQLite
RUN apt-get update && apt-get install -y sqlite3

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file to install dependencies
COPY requirements.txt .

# Install Python dependencies
RUN pip install -r requirements.txt

# Copy the rest of the application code to the container
COPY . .

# Expose the port that your app will run on
EXPOSE 5000

# Start the application
CMD ["python", "app.py"]
