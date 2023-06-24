import React, { useState } from "react";
import data from "../data/module.json";
import "../css/module.css";

function Module({modules}) {
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const handleModuleClick = (module) => {
    setSelectedModule(module === selectedModule ? null : module);
  };

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic === selectedTopic ? null : topic);
  };

  console.log(modules);

  return (
    <div className="module-container">
      {modules.map((module) => (
        <div key={module.id} className="module-wrapper">
          {" "}
          {}
          <button
            className="module-button"
            onClick={() => handleModuleClick(module)}
            style={{
              fontWeight: module === selectedModule ? "bold" : "normal",
            }}
          >
            {module.name}
          </button>
          {module === selectedModule && (
            <div className="topics">
              {module.topics.map((topic) => (
                <div key={topic.id} className="topic">
                  <h4 onClick={() => handleTopicClick(topic)}>{topic.name}</h4>
                  {topic === selectedTopic && 
                  topic.video &&
                  (
                    <ul>
                      {topic.videos.map((video) => (
                        <li key={video.id}>
                          <a href={`https://www.youtube.com/watch?v=${video.id}`}>
                            <div className="video-details">
                              <div className="video-thumbnail">
                                <img src={video.thumbnail.url} alt={video.title} />
                              </div>
                              <div className="video-info">
                                <p>{video.title}</p>
                                <span>{video.views} views</span>
                              </div>
                            </div>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Module;
