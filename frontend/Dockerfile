# Use the official Node.js image as a base
FROM node:16

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json first to utilize Docker cache efficiently
COPY package*.json ./

# Install dependencies
RUN npm install

# Install required packages for Tailwind CSS, React components, etc.
RUN npm install lucide-react @radix-ui/react-alert-dialog tailwindcss postcss autoprefixer react-chartjs-2 chart.js

# Copy the rest of the application code
COPY . .

# Initialize Tailwind CSS
RUN npx tailwindcss init -p

# Expose the port that your app will run on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
